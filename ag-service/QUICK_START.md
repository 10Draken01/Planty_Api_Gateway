# Quick Start - AG-Service

Guía rápida para ejecutar el servicio en 5 minutos.

## 1. Prerequisitos

- Node.js 18+
- MongoDB 7.0+ (o Docker)

## 2. Instalación Rápida

```bash
# Clonar e instalar
cd ag-service
npm install

# Copiar configuración
cp .env.example .env
```

## 3. Iniciar MongoDB (con Docker)

```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  --name plantgen-mongodb mongo:7.0
```

## 4. Iniciar Servicio

```bash
npm run dev
```

Verás:
```
🚀 AG-Service running on port 3005
Environment: development
API Version: v1
Health check: http://localhost:3005/v1/health
```

## 5. Probar API

### Health Check

```bash
curl http://localhost:3005/v1/health
```

### Generar Huerto (request vacío)

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

El servicio generará valores aleatorios y retornará 3 soluciones óptimas.

### Generar Huerto (personalizado)

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": { "width": 2.0, "height": 1.5 },
    "waterLimit": 200,
    "objective": "alimenticio",
    "userExperience": 2
  }'
```

## 6. Verificar Resultado

La respuesta incluirá:
- ✅ 3 soluciones optimizadas
- ✅ Métricas de fitness (CEE, PSRNT, EH, UE)
- ✅ Calendario de siembra
- ✅ Estimaciones de producción y costos
- ✅ Matriz de compatibilidad

## Próximos Pasos

- Ver [README.md](README.md) para documentación completa
- Explorar endpoints en [API.md](API.md)
- Personalizar parámetros del AG en `.env`

## Troubleshooting

**Error: Cannot connect to MongoDB**
```bash
# Verificar que MongoDB esté corriendo
docker ps | grep mongo

# Reiniciar MongoDB
docker restart plantgen-mongodb
```

**Error: EADDRINUSE 3005**
```bash
# Puerto 3005 ocupado, cambiar en .env
PORT=3006
```

**Servicio muy lento**
```bash
# Reducir parámetros en .env
AG_POPULATION_SIZE=20
AG_MAX_GENERATIONS=80
```
