# Build context must be the REPOSITORY ROOT (not apps/backend): the backend
# depends on the workspace package packages/shared.
#   docker build -f apps/backend/Dockerfile .
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11.15.1 --activate

# Manifests first so the dependency layer is cached between code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
# NODE_ENV=production would skip devDependencies (typescript, @nestjs/cli) needed to build.
RUN NODE_ENV=development pnpm install --frozen-lockfile --filter backend...

COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm --filter @libas/shared build && pnpm --filter backend build

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main.js"]
