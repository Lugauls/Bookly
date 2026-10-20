FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @bookly/api...

COPY apps/api apps/api
RUN pnpm --filter @bookly/api prisma:generate \
  && pnpm --filter @bookly/api build \
  && pnpm --filter @bookly/api deploy --prod /prod/api

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /prod/api ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
