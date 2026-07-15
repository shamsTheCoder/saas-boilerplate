import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { OrgRole } from "@prisma/client";
import { OrganizationsService } from "@/modules/organizations/organizations.service";
import { CreateOrgDto } from "@/modules/organizations/dto/create-org.dto";
import { UpdateOrgDto } from "@/modules/organizations/dto/update-org.dto";
import { InviteMemberDto } from "@/modules/organizations/dto/invite-member.dto";
import { AcceptInvitationDto } from "@/modules/organizations/dto/accept-invitation.dto";
import {
  CurrentUser,
  RequestUser,
} from "@/common/decorators/current-user.decorator";
import { OrgRoles } from "@/common/decorators/org-roles.decorator";
import { OrgRolesGuard } from "@/common/guards/org-roles.guard";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("orgs")
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  // ─── POST /orgs — Create Organization ────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Create a new organization (creator becomes OWNER, onboarding complete)",
  })
  @ApiResponse({ status: 201, description: "Organization created" })
  createOrg(@CurrentUser() user: RequestUser, @Body() dto: CreateOrgDto) {
    return this.orgsService.createOrg(user.userId, dto);
  }

  // ─── GET /orgs/my — List My Organizations ────────────────────────────────

  @Get("my")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List all organizations the current user is a member of",
  })
  @ApiResponse({
    status: 200,
    description: "List of user's organizations with their role",
  })
  getMyOrgs(@CurrentUser() user: RequestUser) {
    return this.orgsService.getMyOrgs(user.userId);
  }

  // ─── POST /orgs/invitations/accept — Accept Invitation ───────────────────
  // NOTE: Must be defined BEFORE /:slug to avoid route conflicts

  @Post("invitations/accept")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Accept an organization invitation using the token from the invite email",
  })
  @ApiResponse({
    status: 200,
    description: "Joined organization",
    schema: {
      properties: { orgSlug: { type: "string" }, role: { type: "string" } },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid or expired invitation" })
  acceptInvitation(
    @CurrentUser() user: RequestUser,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.orgsService.acceptInvitation(dto.token, user.userId);
  }

  // ─── GET /orgs/:slug — Get Organization Details ───────────────────────────

  @Get(":slug")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.MEMBER)
  @ApiParam({ name: "slug", description: "Organization slug (from URL)" })
  @ApiOperation({ summary: "Get organization details by slug" })
  @ApiResponse({ status: 200, description: "Organization details" })
  @ApiResponse({
    status: 403,
    description: "Not a member of this organization",
  })
  @ApiResponse({ status: 404, description: "Organization not found" })
  getOrgBySlug(@Param("slug") slug: string) {
    return this.orgsService.getOrgBySlug(slug);
  }

  // ─── PATCH /orgs/:orgId — Update Organization ────────────────────────────

  @Patch(":orgId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN)
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiOperation({
    summary: "Update organization name or logo (ADMIN or OWNER only)",
  })
  @ApiResponse({ status: 200, description: "Organization updated" })
  @ApiResponse({ status: 403, description: "Insufficient role" })
  updateOrg(
    @Param("orgId") orgId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOrgDto,
  ) {
    return this.orgsService.updateOrg(orgId, user.userId, dto);
  }

  // ─── GET /orgs/:orgId/members — List Members ─────────────────────────────

  @Get(":orgId/members")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.MEMBER)
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiOperation({ summary: "List all members of an organization" })
  @ApiResponse({ status: 200, description: "Member list" })
  listMembers(@Param("orgId") orgId: string) {
    return this.orgsService.listMembers(orgId);
  }

  // ─── POST /orgs/:orgId/invitations — Invite Member ───────────────────────

  @Post(":orgId/invitations")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN)
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiOperation({
    summary: "Invite a user to the organization (ADMIN or OWNER only)",
  })
  @ApiResponse({ status: 201, description: "Invitation sent" })
  @ApiResponse({ status: 409, description: "User is already a member" })
  inviteMember(
    @Param("orgId") orgId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgsService.inviteMember(orgId, user.userId, dto);
  }

  // ─── DELETE /orgs/:orgId/members/:memberId — Remove Member ───────────────

  @Delete(":orgId/members/:memberId")
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrgRolesGuard)
  @OrgRoles(OrgRole.ADMIN)
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiParam({
    name: "memberId",
    description: "OrgMember record ID (not userId)",
  })
  @ApiOperation({
    summary: "Remove a member from the organization (ADMIN or OWNER only)",
  })
  @ApiResponse({ status: 200, description: "Member removed" })
  @ApiResponse({
    status: 403,
    description: "Cannot remove owner or insufficient role",
  })
  removeMember(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.orgsService.removeMember(orgId, memberId, user.userId);
  }
}
