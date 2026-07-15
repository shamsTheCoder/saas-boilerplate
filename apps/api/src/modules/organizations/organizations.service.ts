import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditLogService } from "@/modules/audit/audit.service";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { OrgRole } from "@prisma/client";
import { CreateOrgDto } from "@/modules/organizations/dto/create-org.dto";
import { UpdateOrgDto } from "@/modules/organizations/dto/update-org.dto";
import { InviteMemberDto } from "@/modules/organizations/dto/invite-member.dto";
import * as crypto from "crypto";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @InjectPinoLogger(OrganizationsService.name)
    private readonly logger: PinoLogger,
  ) {}

  // ─── Slug Generation ──────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // strip special chars
      .replace(/\s+/g, "-") // spaces → dashes
      .replace(/-+/g, "-") // collapse multiple dashes
      .slice(0, 40); // cap at 40 chars before suffix
    const suffix = crypto.randomBytes(2).toString("hex"); // e.g. "a3f9"
    return `${base}-${suffix}`;
  }

  // ─── Create Organization ──────────────────────────────────────────────────

  async createOrg(userId: string, dto: CreateOrgDto) {
    const slug = this.generateSlug(dto.name);

    // Atomic: create org + make creator OWNER + mark onboarding complete
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.name, slug },
      });

      await tx.orgMember.create({
        data: { userId, organizationId: org.id, role: OrgRole.OWNER },
      });

      await tx.user.update({
        where: { id: userId },
        data: { onboardingComplete: true },
      });

      return org;
    });

    this.auditLog.log({
      organizationId: result.id,
      userId,
      action: "org.created",
      metadata: { orgId: result.id, name: result.name, slug: result.slug },
    });

    this.logger.info(
      { userId, orgId: result.id, slug: result.slug },
      "Organization created",
    );
    return result;
  }

  // ─── Get My Organizations ─────────────────────────────────────────────────

  async getMyOrgs(userId: string) {
    const memberships = await this.prisma.orgMember.findMany({
      where: { userId, organization: { deletedAt: null } },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logoUrl,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  // ─── Get Organization By Slug ─────────────────────────────────────────────

  async getOrgBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    });

    if (!org) throw new NotFoundException(`Organization '${slug}' not found`);
    return org;
  }

  // ─── Update Organization ──────────────────────────────────────────────────

  async updateOrg(orgId: string, userId: string, dto: UpdateOrgDto) {
    const org = await this.prisma.organization.update({
      where: { id: orgId, deletedAt: null },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });

    this.auditLog.log({
      organizationId: orgId,
      userId,
      action: "org.updated",
      metadata: dto as Record<string, unknown>,
    });

    return org;
  }

  // ─── List Members ─────────────────────────────────────────────────────────

  async listMembers(orgId: string) {
    return this.prisma.orgMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // ─── Invite Member ────────────────────────────────────────────────────────

  async inviteMember(orgId: string, inviterId: string, dto: InviteMemberDto) {
    // Check the invitee isn't already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyMember = await this.prisma.orgMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: orgId,
          },
        },
      });
      if (alreadyMember) {
        throw new ConflictException(
          "This user is already a member of the organization",
        );
      }
    }

    // Invalidate any existing pending invite for this email+org
    await this.prisma.invitation.deleteMany({
      where: { email: dto.email, organizationId: orgId },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        organizationId: orgId,
        role: dto.role,
        tokenHash, // SECURITY FIX
        expiresAt,
      },
    });

    // STUB: EMAIL_JOB { type: 'invitation', to: dto.email, token: rawToken }
    // SECURITY: never log the raw token — mask it
    this.logger.info(
      { type: "invitation", to: dto.email, tokenMasked: rawToken.slice(0, 8) + '...', orgId },
      "EMAIL_JOB",
    );

    this.auditLog.log({
      organizationId: orgId,
      userId: inviterId,
      action: "member.invited",
      metadata: { inviteeEmail: dto.email, role: dto.role },
    });

    return { message: "Invitation sent", invitationId: invitation.id };
  }

  // ─── Accept Invitation ────────────────────────────────────────────────────

  async acceptInvitation(token: string, userId: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      if (invitation)
        await this.prisma.invitation.delete({ where: { tokenHash } });
      throw new BadRequestException("Invalid or expired invitation link");
    }

    // BUG FIX (SECURITY): Prevent Invitation Hijacking!
    // We MUST verify that the logged-in user's email matches the email the invite was sent to.
    // Otherwise, an intercepted link could be used by a totally different, unauthorized account.
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (
      !currentUser ||
      currentUser.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new ForbiddenException(
        "This invitation was sent to a different email address. Please log in with the correct account to accept it.",
      );
    }

    // Check if user is already a member (idempotent — return success gracefully)
    const existingMembership = await this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId,
        },
      },
    });

    if (existingMembership) {
      await this.prisma.invitation.delete({ where: { tokenHash } });
      return {
        message: "You are already a member of this organization",
        orgSlug: invitation.organization.slug,
        orgId: invitation.organizationId,
        role: existingMembership.role,
      };
    }

    // Atomic: delete invitation + create membership
    await this.prisma.$transaction([
      this.prisma.invitation.delete({ where: { tokenHash } }),
      this.prisma.orgMember.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
    ]);

    this.auditLog.log({
      organizationId: invitation.organizationId,
      userId,
      action: "member.joined",
      metadata: { role: invitation.role },
    });

    this.logger.info(
      { userId, orgId: invitation.organizationId },
      "Invitation accepted",
    );

    return {
      message: "Successfully joined the organization",
      orgSlug: invitation.organization.slug,
      orgId: invitation.organizationId,
      role: invitation.role,
    };
  }

  // ─── Remove Member ────────────────────────────────────────────────────────

  async removeMember(
    orgId: string,
    memberId: string,
    requestingUserId: string,
  ) {
    const memberToRemove = await this.prisma.orgMember.findUnique({
      where: { id: memberId, organizationId: orgId },
    });

    if (!memberToRemove)
      throw new NotFoundException("Member not found in this organization");

    // OWNERs cannot be removed — they must transfer ownership first
    if (memberToRemove.role === OrgRole.OWNER) {
      throw new ForbiddenException(
        "Cannot remove the organization owner. Transfer ownership first.",
      );
    }

    // A member cannot remove themselves via this endpoint (use a dedicated "leave" endpoint if needed)
    if (memberToRemove.userId === requestingUserId) {
      throw new ForbiddenException(
        "Use the leave organization endpoint to remove yourself",
      );
    }

    await this.prisma.orgMember.delete({ where: { id: memberId } });

    this.auditLog.log({
      organizationId: orgId,
      userId: requestingUserId,
      action: "member.removed",
      metadata: {
        removedUserId: memberToRemove.userId,
        role: memberToRemove.role,
      },
    });

    return { message: "Member removed successfully" };
  }
}
