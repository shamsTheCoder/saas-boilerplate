import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class AcceptInvitationDto {
  @ApiProperty({
    example: "a1b2c3d4e5f6g7h8i9j0",
    description: "The 64-character token from the invitation link",
  })
  @IsString()
  @MinLength(32)
  token: string;
}
