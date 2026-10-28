import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfessionalResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Lucas Almeida' })
  name!: string;

  @ApiPropertyOptional({ example: 'Lucas Barber', nullable: true })
  businessName!: string | null;

  @ApiProperty({ example: 'lucas@bookly.local', format: 'email' })
  email!: string;

  @ApiProperty({ example: '5592999999999' })
  phone!: string;

  @ApiProperty({ example: 'lucas-barber' })
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'America/Manaus' })
  timezone!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
