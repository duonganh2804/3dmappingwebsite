# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files of the API subproject
COPY web-gis-platform/apps/api/package*.json ./
RUN npm ci --omit=dev

# Copy source code of the API subproject
COPY web-gis-platform/apps/api/ .

# Build TypeScript
RUN npm run build

# ─── Stage 2: Production Image ──────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Cài đặt Node.js dependencies production từ builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy prisma schema và generated client từ workspace root
COPY web-gis-platform/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["node", "dist/server.js"]
