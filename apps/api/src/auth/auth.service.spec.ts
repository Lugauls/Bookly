import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedProfessional } from '../professionals/professional.select.js';

const professional: AuthenticatedProfessional = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Lucas Almeida',
  businessName: 'Lucas Barber',
  email: 'lucas@example.com',
  phone: '5592999999999',
  slug: 'lucas-barber',
  bio: null,
  timezone: 'America/Manaus',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createSubject = () => {
  const prisma = {
    professional: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-access-token'),
  };
  const config = {
    get: jest.fn().mockReturnValue('15m'),
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
    config as unknown as ConfigService,
  );

  return { config, jwtService, prisma, service };
};

describe('AuthService', () => {
  it('registers with an Argon2id hash and never returns the hash', async () => {
    const { jwtService, prisma, service } = createSubject();
    prisma.professional.findFirst.mockResolvedValue(null);
    prisma.professional.create.mockResolvedValue(professional);

    const response = await service.register({
      name: ' Lucas Almeida ',
      businessName: ' Lucas Barber ',
      email: 'LUCAS@EXAMPLE.COM',
      password: 'Bookly@123',
      phone: '+55 (92) 99999-9999',
      slug: 'Lucas-Barber',
    });

    const createInput = prisma.professional.create.mock.calls[0][0] as {
      data: { passwordHash: string; password?: string };
    };

    expect(createInput.data).not.toHaveProperty('password');
    await expect(
      argon2.verify(createInput.data.passwordHash, 'Bookly@123'),
    ).resolves.toBe(true);
    expect(createInput.data.passwordHash).toContain('$argon2id$');
    expect(response.professional).not.toHaveProperty('passwordHash');
    expect(response).toMatchObject({
      accessToken: 'signed-access-token',
      expiresIn: '15m',
      tokenType: 'Bearer',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: professional.id,
      email: professional.email,
      type: 'access',
    });
  });

  it('logs in with valid credentials and returns a generic error otherwise', async () => {
    const { prisma, service } = createSubject();
    const passwordHash = await argon2.hash('Bookly@123', {
      type: argon2.argon2id,
    });
    prisma.professional.findUnique.mockResolvedValue({
      ...professional,
      passwordHash,
    });

    const response = await service.login({
      email: 'LUCAS@EXAMPLE.COM',
      password: 'Bookly@123',
    });

    expect(prisma.professional.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'lucas@example.com' } }),
    );
    expect(response.professional).toEqual(professional);
    expect(response.professional).not.toHaveProperty('passwordHash');

    await expect(
      service.login({
        email: 'lucas@example.com',
        password: 'SenhaIncorreta123',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<UnauthorizedException>>({
        message: 'Email ou senha inválidos.',
      }),
    );
  });

  it('rejects a duplicate email before hashing a password', async () => {
    const { prisma, service } = createSubject();
    prisma.professional.findFirst.mockResolvedValue({
      email: professional.email,
      slug: professional.slug,
    });

    await expect(
      service.register({
        name: professional.name,
        email: professional.email,
        password: 'Bookly@123',
        phone: professional.phone,
        slug: 'outro-slug',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.professional.create).not.toHaveBeenCalled();
  });
});
