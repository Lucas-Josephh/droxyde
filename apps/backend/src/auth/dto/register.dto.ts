import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { RegisterPayload } from '@droxyde/types';

export class RegisterDto implements RegisterPayload {
  @ApiProperty({ example: 'jane@droxyde.io' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'S3cret!Passw0rd' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
