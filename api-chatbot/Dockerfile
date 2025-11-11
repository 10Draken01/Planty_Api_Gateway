# Chatbot Service Dockerfile
FROM node:20-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de TypeScript (si es necesario)
RUN npm run build || true

# Etapa de producción
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar node_modules y archivos compilados
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts

# Si no hay carpeta dist, copiar src
COPY --chown=nodejs:nodejs ./src ./src

# Crear directorios necesarios
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3003

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3003
ENV NODE_OPTIONS=--max-old-space-size=8192

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar aplicación
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--max-old-space-size=8192", "dist/app.js"]
