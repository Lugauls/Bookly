import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalResponseDto } from '../../professionals/dto/professional-response.dto.js';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT de acesso.' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: '15m' })
  expiresIn!: string;

  @ApiProperty({ type: ProfessionalResponseDto })
  professional!: ProfessionalResponseDto;
}
