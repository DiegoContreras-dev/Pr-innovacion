# ── Etapa 1: construcción ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (capa cacheada)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y construir
COPY . .
RUN npm run build

# ── Etapa 2: servidor de producción ──────────────────────────────────────────
FROM nginx:1.27-alpine AS produccion

# Configuración nginx para SPA (react-router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos generados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
