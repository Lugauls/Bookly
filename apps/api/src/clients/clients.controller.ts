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
import type { ClientResponse } from './client.select.js';
import {
  ClientsService,
  type ClientRemovalResult,
} from './clients.service.js';
import {
  ClientRemovalResponseDto,
  ClientResponseDto,
} from './dto/client-response.dto.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { UpdateClientDto } from './dto/update-client.dto.js';

@ApiTags('clients')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiCreatedResponse({ type: ClientResponseDto })
  create(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Body() dto: CreateClientDto,
  ): Promise<ClientResponse> {
    return this.clientsService.create(professional.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: ClientResponseDto, isArray: true })
  findAll(
    @CurrentProfessional() professional: AuthenticatedProfessional,
  ): Promise<ClientResponse[]> {
    return this.clientsService.findAll(professional.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ClientResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
  findOne(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClientResponse> {
    return this.clientsService.findOne(professional.id, id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ClientResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
  update(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponse> {
    return this.clientsService.update(professional.id, id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ClientRemovalResponseDto })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
  remove(
    @CurrentProfessional() professional: AuthenticatedProfessional,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClientRemovalResult> {
    return this.clientsService.remove(professional.id, id);
  }
}
