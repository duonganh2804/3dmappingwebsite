# ─── Build Stage ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production Stage ────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copy file build của Vite sang thư mục serving của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config để hỗ trợ React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
