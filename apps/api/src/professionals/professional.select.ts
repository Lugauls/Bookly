import { Prisma } from '../generated/prisma/client.js';

export const professionalAccountSelect = {
  id: true,
  name: true,
  businessName: true,
  email: true,
  phone: true,
  slug: true,
  bio: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfessionalSelect;

export type AuthenticatedProfessional = Prisma.ProfessionalGetPayload<{
  select: typeof professionalAccountSelect;
}>;
