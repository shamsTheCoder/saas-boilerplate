import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrgRole } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { ORG_ROLES_KEY } from "@/common/decorators/org-roles.decorator";
import { RequestUser } from "@/common/decorators/current-user.decorator";

/**
 * Verifies the authenticated user has the required OrgRole in the requested org.
 *
 * Reads the org identifier from:
 * 1. `req.params.orgId` — for routes using orgId directly
 * 2. `req.params.slug` — for routes using slug (looks up org first)
 *
 * Must be applied AFTER JwtAuthGuard (req.user must already be populated).
 */
@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(
      ORG_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @OrgRoles() decorator, the guard is a no-op
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    const { orgId, slug } = request.params as { orgId?: string; slug?: string };

    let organizationId = orgId;

    // Resolve orgId from slug if needed
    if (!organizationId && slug) {
      const org = await this.prisma.organization.findUnique({
        where: { slug, deletedAt: null },
        select: { id: true },
      });
      if (!org) throw new NotFoundException(`Organization '${slug}' not found`);
      organizationId = org.id;
    }

    if (!organizationId)
      throw new ForbiddenException("Organization context required");

    const membership = await this.prisma.orgMember.findUnique({
      where: { userId_organizationId: { userId: user.userId, organizationId } },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this organization");
    }

    // Role hierarchy: OWNER > ADMIN > MEMBER
    const roleHierarchy: Record<OrgRole, number> = {
      [OrgRole.OWNER]: 3,
      [OrgRole.ADMIN]: 2,
      [OrgRole.MEMBER]: 1,
    };

    const userRoleLevel = roleHierarchy[membership.role];
    const meetsRequirement = requiredRoles.some(
      (required) => userRoleLevel >= roleHierarchy[required],
    );

    if (!meetsRequirement) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(" or ")}. Your role: ${membership.role}`,
      );
    }

    // Attach the resolved organizationId and membership to the request for use in controllers
    request.organizationId = organizationId;
    request.membership = membership;

    return true;
  }
}
