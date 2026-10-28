import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  digitsOnly,
  trimLowercaseString,
  trimString,
} from '../../common/transforms/string.transforms.js';
import { IsIanaTimeZone } from '../../common/validators/is-iana-time-zone.validator.js';

export class RegisterDto {
  @ApiProperty({ example: 'Lucas Almeida', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Lucas Barber', maxLength: 120 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  businessName?: string;

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

  @ApiProperty({ example: '5592999999999' })
  @Transform(digitsOnly)
  @Matches(/^\d{8,15}$/, {
    message: 'phone deve conter entre 8 e 15 dígitos.',
  })
  phone!: string;

  @ApiProperty({ example: 'lucas-barber', minLength: 3, maxLength: 80 })
  @Transform(trimLowercaseString)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter letras minúsculas, números e hífens simples.',
  })
  @MinLength(3)
  @MaxLength(80)
  slug!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ default: 'America/Manaus', maxLength: 64 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  @IsIanaTimeZone()
  timezone?: string;
}
