import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { trimLowercaseString } from '../../common/transforms/string.transforms.js';

export class LoginDto {
  @ApiProperty({ example: 'lucas@example.com', format: 'email' })
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'uma-senha-segura', minLength: 8, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
