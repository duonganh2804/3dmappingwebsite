# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ─── Stage 2: Production Image ──────────────────────────────────────
FROM node:20-slim AS production

# Cài Python 3.12 và các công cụ hệ thống cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    gcc \
    g++ \
    cmake \
    libproj-dev \
    proj-bin \
    libgeos-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài đặt Node.js dependencies production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Cài Python GIS packages
COPY ../../tools/3d-optimizer/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt --break-system-packages

# Copy prisma schema và generated client
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/server.js"]
