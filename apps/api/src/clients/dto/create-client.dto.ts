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

export class CreateClientDto {
  @ApiProperty({ example: 'Mariana Souza', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '5592999999999' })
  @Transform(digitsOnly)
  @Matches(/^\d{8,15}$/, {
    message: 'phone deve conter entre 8 e 15 dígitos.',
  })
  phone!: string;

  @ApiPropertyOptional({ example: 'mariana@example.com', format: 'email' })
  @IsOptional()
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
