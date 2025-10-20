# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm install && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma (OpenSSL and runtime libs)
RUN apk add --no-cache \
    dumb-init \
    openssl \
    libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production && npm cache clean --force

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client (as root before switching user)
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy seed scripts for production seeding
COPY --from=builder /app/src/seed.ts ./src/seed.ts
COPY --from=builder /app/src/seed-production.ts ./src/seed-production.ts

# Copy Prisma Client generated files from builder with correct permissions
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && \
    chown -R node:node /app/uploads && \
    chown -R node:node /app/node_modules

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --spider -q http://localhost:3000/health || exit 1

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node dist/server.js"]
