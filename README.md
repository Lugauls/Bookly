# Bookly

O Bookly é uma agenda para profissionais autônomos divulgarem horários livres e manterem controle manual sobre os agendamentos confirmados.

Este repositório está em desenvolvimento incremental. A fundação contém uma API NestJS, uma aplicação React e PostgreSQL local com Docker.

## Requisitos

- Node.js 24.11 ou superior
- Corepack
- Docker Desktop

## Primeiros passos

```bash
corepack pnpm install
docker compose up -d postgres
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

A API fica disponível em `http://localhost:3000`, o health check em `http://localhost:3000/health`, o Swagger em `http://localhost:3000/docs` e o frontend em `http://localhost:5173`.

O PostgreSQL do Docker é exposto em `localhost:5433` para não conflitar com instalações locais que normalmente usam a porta `5432`.

Copie `.env.example` para `.env` ao preparar outro ambiente. O arquivo `.env` local não é versionado.

## Comandos úteis

```bash
corepack pnpm build
corepack pnpm check
corepack pnpm test
corepack pnpm db:up
corepack pnpm db:down
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm prisma:generate
```

O seed de desenvolvimento cria o perfil `Lucas Barber`. As credenciais temporárias de demonstração são `lucas@bookly.local` e `Bookly@123`; troque-as em qualquer ambiente que não seja estritamente local.

Na disponibilidade semanal, `weekday` segue a convenção JavaScript: `0` é domingo e `6` é sábado. Horários recorrentes são armazenados como hora local; agendamentos e bloqueios são instantes UTC (`timestamptz`).

## Estrutura

```text
apps/
  api/   API NestJS e Prisma
  web/   React, Vite e Tailwind CSS
```

A documentação completa, decisões arquiteturais, seed, migrations e instruções de deploy serão adicionadas nas respectivas fases do projeto.
