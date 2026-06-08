# Multi-stage build for the NestJS API (monorepo-aware: needs the workspace packages).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/intelligence/package.json packages/intelligence/
COPY packages/providers/package.json packages/providers/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @riyada/database prisma generate \
 && pnpm --filter @riyada/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/packages ./packages
EXPOSE 4000
CMD ["node", "dist/main.js"]
