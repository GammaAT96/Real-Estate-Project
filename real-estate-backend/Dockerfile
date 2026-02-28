# ─────────────────────────────────────────────
# Stage 1: Builder
#   - Install ALL deps (including devDeps)
#   - Compile TypeScript → dist/
#   - Generate Prisma client
# ─────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL — required by Prisma binary engine
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy manifests first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install everything (devDeps needed for tsc + prisma generate)
RUN npm ci

# Generate Prisma client into node_modules
RUN npx prisma generate

# Copy source and compile
COPY src ./src/
RUN npm run build


# ─────────────────────────────────────────────
# Stage 2: Runner (production)
#   - Fresh slim image
#   - Production dependencies only
#   - Pre-compiled dist/ copied from builder
# ─────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# OpenSSL required at runtime by Prisma
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy only what's needed at runtime
COPY package*.json ./
COPY prisma ./prisma/

# Install production deps only (no devDeps)
RUN npm ci --omit=dev

# Re-generate Prisma client for production deps layer
RUN npx prisma generate

# Copy compiled JS from builder stage
COPY --from=builder /app/dist ./dist/

# Copy startup script
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 5000

# Health check — hits the /health route every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
