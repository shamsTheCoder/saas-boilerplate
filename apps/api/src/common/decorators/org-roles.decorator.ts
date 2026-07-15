import { SetMetadata } from "@nestjs/common";
import { OrgRole } from "@prisma/client";

export const ORG_ROLES_KEY = "orgRoles";

/**
 * Requires the authenticated user to have one of the specified roles in the target org.
 * Used together with OrgRolesGuard.
 *
 * Usage: @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
 */
export const OrgRoles = (...roles: OrgRole[]) =>
  SetMetadata(ORG_ROLES_KEY, roles);
