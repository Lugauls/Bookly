import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Corte masculino' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 30 })
  durationMinutes!: number;

  @ApiPropertyOptional({ example: 4500, nullable: true })
  priceCents!: number | null;

  @ApiProperty({ example: true })
  active!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class ServiceRemovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['deleted', 'deactivated'] })
  outcome!: 'deleted' | 'deactivated';
}
