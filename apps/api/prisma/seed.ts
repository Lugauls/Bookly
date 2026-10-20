import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'argon2';
import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AppointmentStatus,
  PrismaClient,
} from '../src/generated/prisma/client.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

loadEnvironment({ path: resolve(currentDirectory, '../../../.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está configurada.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = {
  professional: '10000000-0000-4000-8000-000000000001',
  services: {
    haircut: '20000000-0000-4000-8000-000000000001',
    beard: '20000000-0000-4000-8000-000000000002',
    combo: '20000000-0000-4000-8000-000000000003',
  },
  clients: {
    ana: '30000000-0000-4000-8000-000000000001',
    bruno: '30000000-0000-4000-8000-000000000002',
  },
  appointments: {
    ana: '40000000-0000-4000-8000-000000000001',
    bruno: '40000000-0000-4000-8000-000000000002',
  },
  timeOff: '50000000-0000-4000-8000-000000000001',
} as const;

const time = (value: string): Date =>
  new Date(`1970-01-01T${value}:00.000Z`);

const nextWeekdayAtManausTime = (
  weekday: number,
  hour: number,
  minute = 0,
): Date => {
  const manausOffsetHours = -4;
  const nowInManaus = new Date(Date.now() + manausOffsetHours * 60 * 60 * 1000);
  const daysAhead = (weekday - nowInManaus.getUTCDay() + 7) % 7 || 7;

  return new Date(
    Date.UTC(
      nowInManaus.getUTCFullYear(),
      nowInManaus.getUTCMonth(),
      nowInManaus.getUTCDate() + daysAhead,
      hour - manausOffsetHours,
      minute,
    ),
  );
};

async function main(): Promise<void> {
  const passwordHash = await hash('Bookly@123');
  const professional = await prisma.professional.upsert({
    where: { email: 'lucas@bookly.local' },
    update: {
      name: 'Lucas',
      businessName: 'Lucas Barber',
      passwordHash,
      phone: '5592999999999',
      slug: 'lucas-barber',
      bio: 'Cortes modernos, barba e atendimento com hora marcada.',
      timezone: 'America/Manaus',
    },
    create: {
      id: ids.professional,
      name: 'Lucas',
      businessName: 'Lucas Barber',
      email: 'lucas@bookly.local',
      passwordHash,
      phone: '5592999999999',
      slug: 'lucas-barber',
      bio: 'Cortes modernos, barba e atendimento com hora marcada.',
      timezone: 'America/Manaus',
    },
  });

  const serviceDefinitions = [
    {
      id: ids.services.haircut,
      name: 'Corte masculino',
      description: 'Corte personalizado e finalização.',
      durationMinutes: 45,
      priceCents: 5000,
    },
    {
      id: ids.services.beard,
      name: 'Barba',
      description: 'Modelagem, toalha quente e acabamento.',
      durationMinutes: 30,
      priceCents: 3500,
    },
    {
      id: ids.services.combo,
      name: 'Corte + barba',
      description: 'Atendimento completo de cabelo e barba.',
      durationMinutes: 75,
      priceCents: 7500,
    },
  ] as const;

  for (const service of serviceDefinitions) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { ...service, active: true, professionalId: professional.id },
      create: { ...service, active: true, professionalId: professional.id },
    });
  }

  const clientDefinitions = [
    {
      id: ids.clients.ana,
      name: 'Ana Souza',
      phone: '5592988881111',
      email: 'ana@example.com',
      notes: 'Prefere atendimento no início da manhã.',
    },
    {
      id: ids.clients.bruno,
      name: 'Bruno Lima',
      phone: '5592988882222',
      email: 'bruno@example.com',
      notes: null,
    },
  ] as const;

  for (const client of clientDefinitions) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: { ...client, archivedAt: null, professionalId: professional.id },
      create: { ...client, professionalId: professional.id },
    });
  }

  const availabilityDefinitions = [
    ...[1, 2, 3, 4, 5].flatMap((weekday) => [
      { weekday, start: '08:00', end: '12:00', period: 1 },
      { weekday, start: '14:00', end: '18:00', period: 2 },
    ]),
    { weekday: 6, start: '08:00', end: '12:00', period: 1 },
  ];

  for (const rule of availabilityDefinitions) {
    const id = `60000000-0000-4000-8${rule.weekday}${rule.period}0-000000000001`;

    await prisma.availabilityRule.upsert({
      where: { id },
      update: {
        professionalId: professional.id,
        weekday: rule.weekday,
        startTime: time(rule.start),
        endTime: time(rule.end),
      },
      create: {
        id,
        professionalId: professional.id,
        weekday: rule.weekday,
        startTime: time(rule.start),
        endTime: time(rule.end),
      },
    });
  }

  const mondayAtNine = nextWeekdayAtManausTime(1, 9);
  const mondayAtEleven = nextWeekdayAtManausTime(1, 11);
  const tuesdayAtNoon = nextWeekdayAtManausTime(2, 12);

  await prisma.appointment.upsert({
    where: { id: ids.appointments.ana },
    update: {
      professionalId: professional.id,
      clientId: ids.clients.ana,
      serviceId: ids.services.haircut,
      startsAt: mondayAtNine,
      endsAt: new Date(mondayAtNine.getTime() + 45 * 60 * 1000),
      status: AppointmentStatus.SCHEDULED,
      cancelledAt: null,
      cancelReason: null,
    },
    create: {
      id: ids.appointments.ana,
      professionalId: professional.id,
      clientId: ids.clients.ana,
      serviceId: ids.services.haircut,
      startsAt: mondayAtNine,
      endsAt: new Date(mondayAtNine.getTime() + 45 * 60 * 1000),
    },
  });

  await prisma.appointment.upsert({
    where: { id: ids.appointments.bruno },
    update: {
      professionalId: professional.id,
      clientId: ids.clients.bruno,
      serviceId: ids.services.beard,
      startsAt: mondayAtEleven,
      endsAt: new Date(mondayAtEleven.getTime() + 30 * 60 * 1000),
      status: AppointmentStatus.SCHEDULED,
      cancelledAt: null,
      cancelReason: null,
    },
    create: {
      id: ids.appointments.bruno,
      professionalId: professional.id,
      clientId: ids.clients.bruno,
      serviceId: ids.services.beard,
      startsAt: mondayAtEleven,
      endsAt: new Date(mondayAtEleven.getTime() + 30 * 60 * 1000),
    },
  });

  await prisma.timeOff.upsert({
    where: { id: ids.timeOff },
    update: {
      professionalId: professional.id,
      startsAt: tuesdayAtNoon,
      endsAt: new Date(tuesdayAtNoon.getTime() + 2 * 60 * 60 * 1000),
      reason: 'Compromisso pessoal',
    },
    create: {
      id: ids.timeOff,
      professionalId: professional.id,
      startsAt: tuesdayAtNoon,
      endsAt: new Date(tuesdayAtNoon.getTime() + 2 * 60 * 60 * 1000),
      reason: 'Compromisso pessoal',
    },
  });

  console.info('Seed concluído: lucas@bookly.local / Bookly@123');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
