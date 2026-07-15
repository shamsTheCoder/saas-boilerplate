import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "alice@acme.co" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "Str0ng!Pass", minLength: 8, maxLength: 100 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiPropertyOptional({ example: "Alice Smith" })
  @IsString()
  @IsOptional()
  name?: string;
}
