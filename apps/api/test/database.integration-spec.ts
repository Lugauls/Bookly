import { config as loadEnvironment } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool, type DatabaseError, type PoolClient } from 'pg';

loadEnvironment({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não está configurada.');
}

const pool = new Pool({ connectionString });

type ConstraintError = DatabaseError & {
  constraint?: string;
};

const expectConstraintViolation = async (
  operation: (client: PoolClient) => Promise<unknown>,
  code: string,
  constraint: string,
): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    try {
      await operation(client);
      throw new Error(`A constraint ${constraint} deveria ter rejeitado a operação.`);
    } catch (error: unknown) {
      const databaseError = error as ConstraintError;

      expect(databaseError.code).toBe(code);
      expect(databaseError.constraint).toBe(constraint);
    }
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
};

describe('Database integrity', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('contains the development seed', async () => {
    const result = await pool.query<{
      appointments: number;
      clients: number;
      professionals: number;
      services: number;
    }>(`
      SELECT
        (SELECT count(*)::int FROM "Professional") AS professionals,
        (SELECT count(*)::int FROM "Service") AS services,
        (SELECT count(*)::int FROM "Client") AS clients,
        (SELECT count(*)::int FROM "Appointment") AS appointments
    `);

    expect(result.rows[0]).toEqual({
      professionals: 1,
      services: 3,
      clients: 2,
      appointments: 2,
    });
  });

  it('rejects overlapping weekly availability', async () => {
    await expectConstraintViolation(
      (client) =>
        client.query(
          `
            INSERT INTO "AvailabilityRule" (
              "id", "professionalId", "weekday", "startTime", "endTime", "updatedAt"
            ) VALUES ($1, $2, 1, TIME '09:00', TIME '10:00', CURRENT_TIMESTAMP)
          `,
          [randomUUID(), '10000000-0000-4000-8000-000000000001'],
        ),
      '23P01',
      'AvailabilityRule_no_overlap',
    );
  });

  it('rejects overlapping scheduled appointments', async () => {
    await expectConstraintViolation(
      async (client) => {
        const existing = await client.query<{
          clientId: string;
          professionalId: string;
          serviceId: string;
          startsAt: Date;
        }>(`
          SELECT "professionalId", "clientId", "serviceId", "startsAt"
          FROM "Appointment"
          WHERE "status" = 'SCHEDULED'
          ORDER BY "startsAt"
          LIMIT 1
        `);
        const appointment = existing.rows[0];

        await client.query(
          `
            INSERT INTO "Appointment" (
              "id", "professionalId", "clientId", "serviceId",
              "startsAt", "endsAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4,
              $5::timestamptz,
              $5::timestamptz + INTERVAL '15 minutes',
              CURRENT_TIMESTAMP
            )
          `,
          [
            randomUUID(),
            appointment.professionalId,
            appointment.clientId,
            appointment.serviceId,
            appointment.startsAt,
          ],
        );
      },
      '23P01',
      'Appointment_no_scheduled_overlap',
    );
  });

  it('accepts appointments that only touch at the boundary', async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const existing = await client.query<{
        clientId: string;
        endsAt: Date;
        professionalId: string;
        serviceId: string;
      }>(`
        SELECT "professionalId", "clientId", "serviceId", "endsAt"
        FROM "Appointment"
        WHERE "status" = 'SCHEDULED'
        ORDER BY "startsAt"
        LIMIT 1
      `);
      const appointment = existing.rows[0];

      await expect(
        client.query(
          `
            INSERT INTO "Appointment" (
              "id", "professionalId", "clientId", "serviceId",
              "startsAt", "endsAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4,
              $5::timestamptz,
              $5::timestamptz + INTERVAL '30 minutes',
              CURRENT_TIMESTAMP
            )
          `,
          [
            randomUUID(),
            appointment.professionalId,
            appointment.clientId,
            appointment.serviceId,
            appointment.endsAt,
          ],
        ),
      ).resolves.toBeDefined();
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('rejects cross-professional client and service references', async () => {
    await expectConstraintViolation(
      async (client) => {
        const secondProfessionalId = randomUUID();
        const secondClientId = randomUUID();
        const secondServiceId = randomUUID();

        await client.query(
          `
            INSERT INTO "Professional" (
              "id", "name", "email", "passwordHash", "phone", "slug", "updatedAt"
            ) VALUES ($1, 'Outro profissional', $2, 'hash', '5592977777777', $3, CURRENT_TIMESTAMP)
          `,
          [
            secondProfessionalId,
            `${secondProfessionalId}@example.com`,
            `professional-${secondProfessionalId}`,
          ],
        );
        await client.query(
          `
            INSERT INTO "Client" (
              "id", "professionalId", "name", "phone", "updatedAt"
            ) VALUES ($1, $2, 'Cliente externo', '5592966666666', CURRENT_TIMESTAMP)
          `,
          [secondClientId, secondProfessionalId],
        );
        await client.query(
          `
            INSERT INTO "Service" (
              "id", "professionalId", "name", "durationMinutes", "updatedAt"
            ) VALUES ($1, $2, 'Serviço externo', 30, CURRENT_TIMESTAMP)
          `,
          [secondServiceId, secondProfessionalId],
        );
        await client.query(
          `
            INSERT INTO "Appointment" (
              "id", "professionalId", "clientId", "serviceId",
              "startsAt", "endsAt", "updatedAt"
            ) VALUES (
              $1,
              '10000000-0000-4000-8000-000000000001',
              $2,
              $3,
              CURRENT_TIMESTAMP + INTERVAL '30 days',
              CURRENT_TIMESTAMP + INTERVAL '30 days 30 minutes',
              CURRENT_TIMESTAMP
            )
          `,
          [randomUUID(), secondClientId, secondServiceId],
        );
      },
      '23503',
      'Appointment_professionalId_clientId_fkey',
    );
  });

  it('allows only one concurrent appointment for the same interval', async () => {
    const appointmentIds = [randomUUID(), randomUUID()];
    const startsAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    startsAt.setUTCMinutes(0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    const values = [
      '10000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      startsAt,
      endsAt,
    ];

    try {
      const attempts = appointmentIds.map((id) =>
        pool.query(
          `
            INSERT INTO "Appointment" (
              "id", "professionalId", "clientId", "serviceId",
              "startsAt", "endsAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `,
          [id, ...values],
        ),
      );
      const results = await Promise.allSettled(attempts);
      const successful = results.filter((result) => result.status === 'fulfilled');
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      expect(successful).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0].reason as ConstraintError).code).toBe('23P01');
      expect((rejected[0].reason as ConstraintError).constraint).toBe(
        'Appointment_no_scheduled_overlap',
      );
    } finally {
      await pool.query('DELETE FROM "Appointment" WHERE "id" = ANY($1::uuid[])', [
        appointmentIds,
      ]);
    }
  });
});
