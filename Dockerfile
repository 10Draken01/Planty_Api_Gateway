# ========= Builder =========
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# ⚠️ Instalar TODAS las deps (incluye TypeScript)
RUN npm ci

# Copiar código
COPY . .

# Build real
RUN npm run build


# ========= Runtime =========
FROM node:20-alpine

# Init + usuario no root
RUN apk add --no-cache dumb-init \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3003

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=8192

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
