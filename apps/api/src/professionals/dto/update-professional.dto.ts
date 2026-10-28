import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  digitsOnly,
  trimLowercaseString,
  trimString,
} from '../../common/transforms/string.transforms.js';
import { IsIanaTimeZone } from '../../common/validators/is-iana-time-zone.validator.js';

export class UpdateProfessionalDto {
  @ApiPropertyOptional({ example: 'Lucas Almeida', minLength: 2, maxLength: 120 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Lucas Barber', maxLength: 120, nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  businessName?: string | null;

  @ApiPropertyOptional({ example: '5592999999999' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(digitsOnly)
  @Matches(/^\d{8,15}$/, {
    message: 'phone deve conter entre 8 e 15 dígitos.',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'lucas-barber', minLength: 3, maxLength: 80 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimLowercaseString)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter letras minúsculas, números e hífens simples.',
  })
  @MinLength(3)
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @ApiPropertyOptional({ example: 'America/Manaus', maxLength: 64 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  @IsIanaTimeZone()
  timezone?: string;
}
