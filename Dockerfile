# syntax=docker/dockerfile:1

# ---------- base: Node + pnpm ----------
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

# ---------- build: all dependencies, compile the app ----------
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# prisma.config.ts insists DATABASE_URL exists, but generate never connects to it.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm prisma generate
RUN pnpm build \
 && cp -r src/docs dist/docs

# ---------- prod-deps: runtime dependencies only ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# ---------- runtime: the image we actually ship ----------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 5000
CMD ["node", "dist/server.js"]