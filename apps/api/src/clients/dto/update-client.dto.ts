import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  digitsOnly,
  trimLowercaseString,
  trimString,
} from '../../common/transforms/string.transforms.js';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Mariana Souza', minLength: 2, maxLength: 120 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '5592999999999' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(digitsOnly)
  @Matches(/^\d{8,15}$/, {
    message: 'phone deve conter entre 8 e 15 dígitos.',
  })
  phone?: string;

  @ApiPropertyOptional({ format: 'email', nullable: true })
  @IsOptional()
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(254)
  email?: string | null;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
