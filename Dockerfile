# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files of the API subproject
COPY web-gis-platform/apps/api/package*.json ./
# Cài đặt toàn bộ dependencies để build
RUN npm ci

# Copy source code of the API subproject
COPY web-gis-platform/apps/api/ .

# Prisma generate chỉ cần schema để sinh types, không cần DB thật.
# Đặt dummy URL để prisma.config.ts không bị lỗi PrismaConfigEnvError khi build.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Tạo kiểu dữ liệu Prisma Client trước khi build
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ─── Stage 2: Production Image ──────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Chỉ cài đặt dependencies cho production
COPY web-gis-platform/apps/api/package*.json ./
RUN npm ci --omit=dev

# Copy code đã biên dịch từ builder
COPY --from=builder /app/dist ./dist

# Copy prisma schema và generate client tại runtime
COPY web-gis-platform/apps/api/prisma ./prisma
COPY web-gis-platform/apps/api/prisma.config.ts ./prisma.config.ts

# Dummy URL chỉ cho bước generate trong production image
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Xóa dummy env — runtime sẽ nhận env thật từ Render dashboard
ENV DATABASE_URL=""
ENV DIRECT_URL=""

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["node", "dist/server.js"]
