import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'bob@acme.co' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: OrgRole, example: OrgRole.MEMBER })
  @IsEnum(OrgRole)
  role: OrgRole;
}
