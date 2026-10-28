import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type JsonObject = Record<string, unknown>;

describe('Authentication HTTP flow', () => {
  let app: INestApplication;
  let baseUrl: string;
  let prisma: PrismaService;

  const suffix = randomUUID().slice(0, 8);
  const email = `phase3-${suffix}@example.com`;
  const initialSlug = `phase3-${suffix}`;
  const updatedSlug = `phase3-updated-${suffix}`;
  const password = 'Bookly@Test123';

  const parseJson = async (response: Response): Promise<JsonObject> =>
    (await response.json()) as JsonObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.listen(0, '127.0.0.1');

    const address = (app.getHttpServer() as Server).address();

    if (!address || typeof address === 'string') {
      throw new Error('Não foi possível obter a porta do servidor de teste.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
    prisma = app.get(PrismaService);
    await prisma.professional.deleteMany({
      where: {
        OR: [{ email }, { slug: { in: [initialSlug, updatedSlug] } }],
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.professional.deleteMany({ where: { email } });
    }

    if (app) {
      await app.close();
    }
  });

  it('registers, logs in, authenticates and updates only the own profile', async () => {
    const registerResponse = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: ' Profissional da Fase 3 ',
        businessName: ' Bookly Test ',
        email: email.toUpperCase(),
        password,
        phone: '+55 (92) 99999-9999',
        slug: initialSlug.toUpperCase(),
        timezone: 'America/Manaus',
      }),
    });
    const registration = await parseJson(registerResponse);
    const registeredProfessional = registration.professional as JsonObject;

    expect(registerResponse.status).toBe(201);
    expect(registration).toMatchObject({
      expiresIn: '15m',
      tokenType: 'Bearer',
    });
    expect(registeredProfessional).toMatchObject({
      email,
      phone: '5592999999999',
      slug: initialSlug,
      timezone: 'America/Manaus',
    });
    expect(registeredProfessional).not.toHaveProperty('passwordHash');

    const unauthorizedResponse = await fetch(`${baseUrl}/auth/me`);
    expect(unauthorizedResponse.status).toBe(401);

    const invalidLoginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'SenhaIncorreta123' }),
    });
    expect(invalidLoginResponse.status).toBe(401);

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.toUpperCase(), password }),
    });
    const login = await parseJson(loginResponse);
    const accessToken = login.accessToken;

    expect(loginResponse.status).toBe(200);
    expect(typeof accessToken).toBe('string');
    expect(login.professional).not.toHaveProperty('passwordHash');

    const meResponse = await fetch(`${baseUrl}/auth/me`, {
      headers: { authorization: `Bearer ${String(accessToken)}` },
    });
    const me = await parseJson(meResponse);

    expect(meResponse.status).toBe(200);
    expect(me).toMatchObject({ email, slug: initialSlug });
    expect(me).not.toHaveProperty('passwordHash');

    const injectedIdResponse = await fetch(`${baseUrl}/professionals/me`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${String(accessToken)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ professionalId: randomUUID() }),
    });
    expect(injectedIdResponse.status).toBe(400);

    const updateResponse = await fetch(`${baseUrl}/professionals/me`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${String(accessToken)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        bio: 'Perfil atualizado no teste de integração.',
        slug: updatedSlug.toUpperCase(),
      }),
    });
    const updatedProfile = await parseJson(updateResponse);

    expect(updateResponse.status).toBe(200);
    expect(updatedProfile).toMatchObject({
      bio: 'Perfil atualizado no teste de integração.',
      email,
      slug: updatedSlug,
    });

    const profileResponse = await fetch(`${baseUrl}/professionals/me`, {
      headers: { authorization: `Bearer ${String(accessToken)}` },
    });
    const profile = await parseJson(profileResponse);

    expect(profileResponse.status).toBe(200);
    expect(profile).toMatchObject({ email, slug: updatedSlug });
    expect(profile).not.toHaveProperty('passwordHash');
  });
});
