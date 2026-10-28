import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentProfessional } from '../auth/current-professional.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfessionalResponseDto } from './dto/professional-response.dto.js';
import { UpdateProfessionalDto } from './dto/update-professional.dto.js';
import type { AuthenticatedProfessional } from './professional.select.js';
import { ProfessionalsService } from './professionals.service.js';

@ApiTags('professionals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
@UseGuards(JwtAuthGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get('me')
  @ApiOkResponse({ type: ProfessionalResponseDto })
  getOwnProfile(
    @CurrentProfessional() professional: AuthenticatedProfessional,
  ): AuthenticatedProfessional {
    return professional;
  }

  @Patch('me')
  @ApiOkResponse({ type: ProfessionalResponseDto })
  @ApiConflictResponse({ description: 'Slug já utilizado.' })
  updateOwnProfile(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Body() dto: UpdateProfessionalDto,
  ): Promise<AuthenticatedProfessional> {
    return this.professionalsService.updateOwnProfile(professional.id, dto);
  }
}
