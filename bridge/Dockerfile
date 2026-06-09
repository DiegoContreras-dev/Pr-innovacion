# Build stage: instala dependencias con herramientas nativas (serialport necesita compilar C++)
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ linux-headers
WORKDIR /app
COPY package.json ./
RUN npm install --production

# Runtime stage: imagen mínima
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
EXPOSE 3001
CMD ["node", "src/index.js"]
