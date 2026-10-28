import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedProfessional } from '../professionals/professional.select.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const professional: AuthenticatedProfessional = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Lucas Almeida',
  businessName: null,
  email: 'lucas@example.com',
  phone: '5592999999999',
  slug: 'lucas-barber',
  bio: null,
  timezone: 'America/Manaus',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createContext = (request: object): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('JwtAuthGuard', () => {
  it('uses the JWT subject to load and attach the authenticated professional', async () => {
    const request = { headers: { authorization: 'Bearer valid-token' } };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: professional.id,
        email: professional.email,
        type: 'access',
      }),
    };
    const prisma = {
      professional: {
        findUnique: jest.fn().mockResolvedValue(professional),
      },
    };
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      prisma as unknown as PrismaService,
    );

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(prisma.professional.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: professional.id } }),
    );
    expect(request).toHaveProperty('user', professional);
  });

  it('rejects requests without a bearer token', async () => {
    const guard = new JwtAuthGuard(
      {} as JwtService,
      {} as PrismaService,
    );

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
