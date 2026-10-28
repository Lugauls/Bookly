import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../common/transforms/string.transforms.js';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Corte masculino', minLength: 2, maxLength: 120 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: 30, minimum: 5, maximum: 1440 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 4500, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  priceCents?: number | null;

  @ApiPropertyOptional({ example: true })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  active?: boolean;
}
