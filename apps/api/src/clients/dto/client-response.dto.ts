import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Mariana Souza' })
  name!: string;

  @ApiProperty({ example: '5592999999999' })
  phone!: string;

  @ApiPropertyOptional({ format: 'email', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  archivedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class ClientRemovalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['deleted', 'archived'] })
  outcome!: 'deleted' | 'archived';
}
