# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluye devDependencies para compilar)
RUN npm ci

# Copiar configuración de TypeScript
COPY tsconfig.json ./

# Copiar todo el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Verificar que dist/app.js existe
RUN ls -la dist/

# Etapa de producción
FROM node:20-alpine

# Instalar dumb-init
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar archivos compilados desde builder
COPY --from=builder /app/dist ./dist

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto (Railway asigna dinámicamente)
EXPOSE 3002

# Health check (opcional pero recomendado)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]