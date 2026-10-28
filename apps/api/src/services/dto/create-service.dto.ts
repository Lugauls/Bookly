import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../common/transforms/string.transforms.js';

export class CreateServiceDto {
  @ApiProperty({ example: 'Corte masculino', minLength: 2, maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Corte com acabamento.', maxLength: 2000 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 30, minimum: 5, maximum: 1440 })
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMinutes!: number;

  @ApiPropertyOptional({ example: 4500, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  priceCents?: number;
}
