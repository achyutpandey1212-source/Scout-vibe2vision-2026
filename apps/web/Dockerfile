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

# Copy web files
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY apps/web/tailwind.config.ts ./apps/web/
COPY apps/web/src ./apps/web/src

# Install dependencies and build
RUN npm ci --include=dev
RUN npm run build --workspace=@scout/shared
RUN npm run build --workspace=@scout/web

# Production Stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /usr/src/app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /usr/src/app/apps/web/package*.json ./apps/web/
COPY --from=builder /usr/src/app/apps/web/next.config.js ./apps/web/
COPY --from=builder /usr/src/app/apps/web/public ./apps/web/public
COPY --from=builder /usr/src/app/apps/web/.next ./apps/web/.next

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start", "-w", "@scout/web"]
