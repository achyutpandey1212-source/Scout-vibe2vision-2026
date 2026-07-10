# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root workspace configurations
COPY package*.json ./
COPY tsconfig.json ./

# Copy packages
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src

# Copy server files
COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/
COPY apps/server/src ./apps/server/src

# Install dependencies and build packages
RUN npm ci --include=dev
RUN npm run build --workspace=@scout/shared
RUN npm run build --workspace=@scout/server

# Production Stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built outputs and node_modules from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/apps/server/package*.json ./apps/server/
COPY --from=builder /usr/src/app/apps/server/dist ./apps/server/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "apps/server/dist/index.js"]
