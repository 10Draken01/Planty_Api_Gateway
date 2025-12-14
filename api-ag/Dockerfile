# Dockerfile para API AG (Genetic Algorithm Service)

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json* ./
COPY tsconfig.json ./

# Instalar dependencias (incluyendo devDependencies para compilar)
RUN npm ci || npm install

# Copiar código fuente
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copiar package files
COPY --chown=nodejs:nodejs package.json package-lock.json* ./
COPY --chown=nodejs:nodejs tsconfig.json ./

# Instalar solo dependencias de producción
RUN (npm ci --only=production || npm install --only=production) && npm cache clean --force

# Copiar build artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copiar archivos de datos (plantas y compatibilidades)
COPY --chown=nodejs:nodejs data ./data

# Crear directorio para logs con permisos correctos
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Cambiar a usuario no-root
USER nodejs

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3005

# Exponer puerto
EXPOSE 3005

# Health check mejorado
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicación con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
