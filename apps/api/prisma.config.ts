import { config as loadEnvironment } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

loadEnvironment({ path: resolve(currentDirectory, '../../.env') });

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: resolve(currentDirectory, 'prisma/schema.prisma'),
  migrations: {
    path: resolve(currentDirectory, 'prisma/migrations'),
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
