import { Prisma } from '../generated/prisma/client.js';

export const serviceResponseSelect = {
  id: true,
  name: true,
  description: true,
  durationMinutes: true,
  priceCents: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceSelect;

export type ServiceResponse = Prisma.ServiceGetPayload<{
  select: typeof serviceResponseSelect;
}>;
