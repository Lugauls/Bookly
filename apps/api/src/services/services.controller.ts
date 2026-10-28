import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentProfessional } from '../auth/current-professional.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedProfessional } from '../professionals/professional.select.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import {
  ServiceRemovalResponseDto,
  ServiceResponseDto,
} from './dto/service-response.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import type { ServiceResponse } from './service.select.js';
import {
  ServicesService,
  type ServiceRemovalResult,
} from './services.service.js';

@ApiTags('services')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiCreatedResponse({ type: ServiceResponseDto })
  create(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceResponse> {
    return this.servicesService.create(professional.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  findAll(
    @CurrentProfessional() professional: AuthenticatedProfessional,
  ): Promise<ServiceResponse[]> {
    return this.servicesService.findAll(professional.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado.' })
  findOne(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ServiceResponse> {
    return this.servicesService.findOne(professional.id, id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ServiceResponseDto })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado.' })
  update(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceResponse> {
    return this.servicesService.update(professional.id, id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ServiceRemovalResponseDto })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado.' })
  remove(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ServiceRemovalResult> {
    return this.servicesService.remove(professional.id, id);
  }
}
