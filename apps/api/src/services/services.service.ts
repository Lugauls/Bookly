import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateServiceDto } from './dto/create-service.dto.js';
import type { UpdateServiceDto } from './dto/update-service.dto.js';
import {
  serviceResponseSelect,
  type ServiceResponse,
} from './service.select.js';

export type ServiceRemovalResult = {
  id: string;
  outcome: 'deleted' | 'deactivated';
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    professionalId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceResponse> {
    return this.prisma.service.create({
      data: {
        professionalId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        priceCents: dto.priceCents,
      },
      select: serviceResponseSelect,
    });
  }

  findAll(professionalId: string): Promise<ServiceResponse[]> {
    return this.prisma.service.findMany({
      where: { professionalId },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: serviceResponseSelect,
    });
  }

  async findOne(
    professionalId: string,
    id: string,
  ): Promise<ServiceResponse> {
    const service = await this.prisma.service.findUnique({
      where: { professionalId_id: { professionalId, id } },
      select: serviceResponseSelect,
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    return service;
  }

  async update(
    professionalId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponse> {
    await this.findOne(professionalId, id);

    const data = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined
        ? {
            description:
              dto.description === null ? null : dto.description.trim(),
          }
        : {}),
      ...(dto.durationMinutes !== undefined
        ? { durationMinutes: dto.durationMinutes }
        : {}),
      ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    };

    if (Object.keys(data).length === 0) {
      return this.findOne(professionalId, id);
    }

    return this.prisma.service.update({
      where: { professionalId_id: { professionalId, id } },
      data,
      select: serviceResponseSelect,
    });
  }

  async remove(
    professionalId: string,
    id: string,
  ): Promise<ServiceRemovalResult> {
    await this.findOne(professionalId, id);

    const appointments = await this.prisma.appointment.count({
      where: { professionalId, serviceId: id },
    });

    if (appointments > 0) {
      return this.deactivate(professionalId, id);
    }

    try {
      await this.prisma.service.delete({
        where: { professionalId_id: { professionalId, id } },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return this.deactivate(professionalId, id);
      }

      throw error;
    }

    return { id, outcome: 'deleted' };
  }

  private async deactivate(
    professionalId: string,
    id: string,
  ): Promise<ServiceRemovalResult> {
    await this.prisma.service.update({
      where: { professionalId_id: { professionalId, id } },
      data: { active: false },
    });

    return { id, outcome: 'deactivated' };
  }
}
