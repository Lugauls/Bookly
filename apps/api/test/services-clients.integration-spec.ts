import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

type JsonObject = Record<string, unknown>;

type ApiResult = {
  body: JsonObject;
  response: Response;
};

describe('Services and clients HTTP flow', () => {
  let app: INestApplication;
  let baseUrl: string;
  let prisma: PrismaService;

  const suffix = randomUUID().slice(0, 8);
  const professionalA = {
    email: `phase4-a-${suffix}@example.com`,
    slug: `phase4-a-${suffix}`,
  };
  const professionalB = {
    email: `phase4-b-${suffix}@example.com`,
    slug: `phase4-b-${suffix}`,
  };
  const password = 'Bookly@Test123';

  const request = async (
    path: string,
    options: {
      body?: JsonObject;
      method?: string;
      token?: string;
    } = {},
  ): Promise<ApiResult> => {
    const headers: Record<string, string> = {};

    if (options.body) {
      headers['content-type'] = 'application/json';
    }

    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const body = (await response.json()) as JsonObject;

    return { body, response };
  };

  const register = async (
    email: string,
    slug: string,
  ): Promise<{ professionalId: string; token: string }> => {
    const result = await request('/auth/register', {
      method: 'POST',
      body: {
        name: `Profissional ${slug}`,
        email,
        password,
        phone: '5592999999999',
        slug,
      },
    });
    const professional = result.body.professional as JsonObject;

    expect(result.response.status).toBe(201);

    return {
      professionalId: String(professional.id),
      token: String(result.body.accessToken),
    };
  };

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
        email: { in: [professionalA.email, professionalB.email] },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.professional.deleteMany({
        where: {
          email: { in: [professionalA.email, professionalB.email] },
        },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('applies CRUD, ownership isolation and history-preserving removals', async () => {
    const accountA = await register(professionalA.email, professionalA.slug);
    const accountB = await register(professionalB.email, professionalB.slug);

    const injectedProfessionalId = await request('/services', {
      method: 'POST',
      token: accountA.token,
      body: {
        professionalId: accountB.professionalId,
        name: 'Serviço inválido',
        durationMinutes: 30,
      },
    });
    expect(injectedProfessionalId.response.status).toBe(400);

    const invalidDuration = await request('/services', {
      method: 'POST',
      token: accountA.token,
      body: { name: 'Serviço inválido', durationMinutes: 0 },
    });
    expect(invalidDuration.response.status).toBe(400);

    const serviceAResult = await request('/services', {
      method: 'POST',
      token: accountA.token,
      body: {
        name: ' Corte premium ',
        description: ' Serviço completo ',
        durationMinutes: 45,
        priceCents: 6500,
      },
    });
    const serviceA = serviceAResult.body;

    expect(serviceAResult.response.status).toBe(201);
    expect(serviceA).toMatchObject({
      active: true,
      description: 'Serviço completo',
      durationMinutes: 45,
      name: 'Corte premium',
      priceCents: 6500,
    });
    expect(serviceA).not.toHaveProperty('professionalId');

    const clientAResult = await request('/clients', {
      method: 'POST',
      token: accountA.token,
      body: {
        name: ' Cliente A ',
        phone: '+55 (92) 98888-7777',
        email: 'CLIENTE.A@EXAMPLE.COM',
        notes: ' Primeiro atendimento ',
      },
    });
    const clientA = clientAResult.body;

    expect(clientAResult.response.status).toBe(201);
    expect(clientA).toMatchObject({
      email: 'cliente.a@example.com',
      name: 'Cliente A',
      notes: 'Primeiro atendimento',
      phone: '5592988887777',
    });
    expect(clientA).not.toHaveProperty('professionalId');

    const serviceBResult = await request('/services', {
      method: 'POST',
      token: accountB.token,
      body: { name: 'Serviço B', durationMinutes: 30 },
    });
    const clientBResult = await request('/clients', {
      method: 'POST',
      token: accountB.token,
      body: { name: 'Cliente B', phone: '5592977776666' },
    });

    const foreignService = await request(
      `/services/${String(serviceBResult.body.id)}`,
      { token: accountA.token },
    );
    expect(foreignService.response.status).toBe(404);

    const foreignClientUpdate = await request(
      `/clients/${String(clientBResult.body.id)}`,
      {
        method: 'PATCH',
        token: accountA.token,
        body: { name: 'Tentativa de acesso' },
      },
    );
    expect(foreignClientUpdate.response.status).toBe(404);

    const servicesA = await request('/services', { token: accountA.token });
    const clientsA = await request('/clients', { token: accountA.token });
    const serviceList = servicesA.body as unknown as JsonObject[];
    const clientList = clientsA.body as unknown as JsonObject[];

    expect(serviceList.map((item) => item.id)).toContain(serviceA.id);
    expect(serviceList.map((item) => item.id)).not.toContain(
      serviceBResult.body.id,
    );
    expect(clientList.map((item) => item.id)).toContain(clientA.id);
    expect(clientList.map((item) => item.id)).not.toContain(
      clientBResult.body.id,
    );

    const updatedService = await request(`/services/${String(serviceA.id)}`, {
      method: 'PATCH',
      token: accountA.token,
      body: { description: null, priceCents: 7000 },
    });
    expect(updatedService.response.status).toBe(200);
    expect(updatedService.body).toMatchObject({
      description: null,
      priceCents: 7000,
    });

    const updatedClient = await request(`/clients/${String(clientA.id)}`, {
      method: 'PATCH',
      token: accountA.token,
      body: { email: null, notes: 'Cliente recorrente' },
    });
    expect(updatedClient.response.status).toBe(200);
    expect(updatedClient.body).toMatchObject({
      email: null,
      notes: 'Cliente recorrente',
    });

    const startsAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    startsAt.setUTCSeconds(0, 0);
    const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);

    await prisma.appointment.create({
      data: {
        professionalId: accountA.professionalId,
        clientId: String(clientA.id),
        serviceId: String(serviceA.id),
        startsAt,
        endsAt,
      },
    });

    const serviceWithHistoryRemoval = await request(
      `/services/${String(serviceA.id)}`,
      { method: 'DELETE', token: accountA.token },
    );
    expect(serviceWithHistoryRemoval.response.status).toBe(200);
    expect(serviceWithHistoryRemoval.body).toEqual({
      id: serviceA.id,
      outcome: 'deactivated',
    });

    const inactiveService = await request(
      `/services/${String(serviceA.id)}`,
      { token: accountA.token },
    );
    expect(inactiveService.body).toMatchObject({ active: false });

    const clientWithHistoryRemoval = await request(
      `/clients/${String(clientA.id)}`,
      { method: 'DELETE', token: accountA.token },
    );
    expect(clientWithHistoryRemoval.response.status).toBe(200);
    expect(clientWithHistoryRemoval.body).toEqual({
      id: clientA.id,
      outcome: 'archived',
    });

    const archivedClient = await request(`/clients/${String(clientA.id)}`, {
      token: accountA.token,
    });
    expect(archivedClient.response.status).toBe(404);
    await expect(
      prisma.client.findUniqueOrThrow({
        where: { id: String(clientA.id) },
        select: { archivedAt: true },
      }),
    ).resolves.toEqual({ archivedAt: expect.any(Date) });

    const disposableService = await request('/services', {
      method: 'POST',
      token: accountA.token,
      body: { name: 'Serviço descartável', durationMinutes: 30 },
    });
    const disposableClient = await request('/clients', {
      method: 'POST',
      token: accountA.token,
      body: { name: 'Cliente descartável', phone: '5592966665555' },
    });

    const deletedService = await request(
      `/services/${String(disposableService.body.id)}`,
      { method: 'DELETE', token: accountA.token },
    );
    const deletedClient = await request(
      `/clients/${String(disposableClient.body.id)}`,
      { method: 'DELETE', token: accountA.token },
    );

    expect(deletedService.body).toEqual({
      id: disposableService.body.id,
      outcome: 'deleted',
    });
    expect(deletedClient.body).toEqual({
      id: disposableClient.body.id,
      outcome: 'deleted',
    });
    await expect(
      prisma.service.findUnique({
        where: { id: String(disposableService.body.id) },
      }),
    ).resolves.toBeNull();
    await expect(
      prisma.client.findUnique({
        where: { id: String(disposableClient.body.id) },
      }),
    ).resolves.toBeNull();
  });
});
