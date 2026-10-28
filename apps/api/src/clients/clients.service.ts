import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  clientResponseSelect,
  type ClientResponse,
} from './client.select.js';
import type { CreateClientDto } from './dto/create-client.dto.js';
import type { UpdateClientDto } from './dto/update-client.dto.js';

export type ClientRemovalResult = {
  id: string;
  outcome: 'deleted' | 'archived';
};

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    professionalId: string,
    dto: CreateClientDto,
  ): Promise<ClientResponse> {
    return this.prisma.client.create({
      data: {
        professionalId,
        name: dto.name.trim(),
        phone: dto.phone.replace(/\D/g, ''),
        email: dto.email?.trim().toLowerCase(),
        notes: dto.notes?.trim(),
      },
      select: clientResponseSelect,
    });
  }

  findAll(professionalId: string): Promise<ClientResponse[]> {
    return this.prisma.client.findMany({
      where: { professionalId, archivedAt: null },
      orderBy: { name: 'asc' },
      select: clientResponseSelect,
    });
  }

  async findOne(
    professionalId: string,
    id: string,
  ): Promise<ClientResponse> {
    const client = await this.prisma.client.findFirst({
      where: { id, professionalId, archivedAt: null },
      select: clientResponseSelect,
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return client;
  }

  async update(
    professionalId: string,
    id: string,
    dto: UpdateClientDto,
  ): Promise<ClientResponse> {
    await this.findOne(professionalId, id);

    const data = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.phone !== undefined
        ? { phone: dto.phone.replace(/\D/g, '') }
        : {}),
      ...(dto.email !== undefined
        ? { email: dto.email === null ? null : dto.email.trim().toLowerCase() }
        : {}),
      ...(dto.notes !== undefined
        ? { notes: dto.notes === null ? null : dto.notes.trim() }
        : {}),
    };

    if (Object.keys(data).length === 0) {
      return this.findOne(professionalId, id);
    }

    return this.prisma.client.update({
      where: { professionalId_id: { professionalId, id } },
      data,
      select: clientResponseSelect,
    });
  }

  async remove(
    professionalId: string,
    id: string,
  ): Promise<ClientRemovalResult> {
    await this.findOne(professionalId, id);

    const appointments = await this.prisma.appointment.count({
      where: { professionalId, clientId: id },
    });

    if (appointments > 0) {
      return this.archive(professionalId, id);
    }

    try {
      await this.prisma.client.delete({
        where: { professionalId_id: { professionalId, id } },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        return this.archive(professionalId, id);
      }

      throw error;
    }

    return { id, outcome: 'deleted' };
  }

  private async archive(
    professionalId: string,
    id: string,
  ): Promise<ClientRemovalResult> {
    await this.prisma.client.update({
      where: { professionalId_id: { professionalId, id } },
      data: { archivedAt: new Date() },
    });

    return { id, outcome: 'archived' };
  }
}
