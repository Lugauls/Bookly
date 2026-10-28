import { Prisma } from '../generated/prisma/client.js';

export const clientResponseSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  notes: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

export type ClientResponse = Prisma.ClientGetPayload<{
  select: typeof clientResponseSelect;
}>;
