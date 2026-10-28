import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateProfessionalDto } from './dto/update-professional.dto.js';
import {
  professionalAccountSelect,
  type AuthenticatedProfessional,
} from './professional.select.js';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOwnProfile(
    professionalId: string,
    dto: UpdateProfessionalDto,
  ): Promise<AuthenticatedProfessional> {
    const data = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.businessName !== undefined
        ? {
            businessName:
              dto.businessName === null ? null : dto.businessName.trim(),
          }
        : {}),
      ...(dto.phone !== undefined
        ? { phone: dto.phone.replace(/\D/g, '') }
        : {}),
      ...(dto.slug !== undefined
        ? { slug: dto.slug.trim().toLowerCase() }
        : {}),
      ...(dto.bio !== undefined
        ? { bio: dto.bio === null ? null : dto.bio.trim() }
        : {}),
      ...(dto.timezone !== undefined
        ? { timezone: dto.timezone.trim() }
        : {}),
    };

    if (Object.keys(data).length === 0) {
      return this.prisma.professional.findUniqueOrThrow({
        where: { id: professionalId },
        select: professionalAccountSelect,
      });
    }

    try {
      return await this.prisma.professional.update({
        where: { id: professionalId },
        data,
        select: professionalAccountSelect,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este slug já está em uso.');
      }

      throw error;
    }
  }
}
