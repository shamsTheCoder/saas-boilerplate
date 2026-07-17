import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn } from "class-validator";
import { OrgRole } from "@prisma/client";

/** The roles that can be assigned via invitation. OWNER must be transferred via a dedicated endpoint. */
const INVITABLE_ROLES = [OrgRole.MEMBER, OrgRole.ADMIN] as const;

export class InviteMemberDto {
  @ApiProperty({ example: "bob@acme.co" })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: INVITABLE_ROLES,
    example: OrgRole.MEMBER,
    description: "Role to assign. OWNER cannot be granted via invitation — use the transfer-ownership endpoint.",
  })
  @IsIn(INVITABLE_ROLES, {
    message: `role must be one of: ${INVITABLE_ROLES.join(", ")}`,
  })
  role: typeof INVITABLE_ROLES[number];
}

