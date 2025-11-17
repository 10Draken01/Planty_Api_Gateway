# 🚀 Guía de Inicio Rápido - API Orchard

## ⚡ Inicio en 3 Pasos

### 1️⃣ Instalar Dependencias

```bash
cd api-orchard
npm install
```

### 2️⃣ Verificar MongoDB

Asegúrate de que MongoDB esté corriendo:

```bash
# Opción 1: MongoDB local
mongod

# Opción 2: Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 3️⃣ Iniciar el Servidor

```bash
# Modo desarrollo (hot reload)
npm run dev
```

El servidor estará disponible en: **http://localhost:3004**

---

## 🧪 Probar el Microservicio

### Health Check

```bash
curl http://localhost:3004/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "service": "orchard-api",
  "status": "healthy",
  "timestamp": "2024-11-14T...",
  "version": "1.0.0"
}
```

### Crear tu Primer Huerto

```bash
curl -X POST http://localhost:3004/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Primer Huerto",
    "description": "Huerto de plantas medicinales",
    "width": 15.5,
    "height": 10.0,
    "plants_id": []
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Huerto creado exitosamente",
  "data": {
    "_id": "uuid-generado",
    "name": "Mi Primer Huerto",
    "description": "Huerto de plantas medicinales",
    "width": 15.5,
    "height": 10.0,
    "area": 155,
    "state": true,
    "plants_id": [],
    "countPlants": 0,
    "timeOfLife": 0,
    "streakOfDays": 0,
    "createAt": "2024-11-14T...",
    "updateAt": "2024-11-14T..."
  }
}
```

### Listar Huertos

```bash
curl http://localhost:3004/orchards
```

### Obtener un Huerto Específico

```bash
curl http://localhost:3004/orchards/{id}
```

### Agregar una Planta

```bash
curl -X POST http://localhost:3004/orchards/{id}/plants \
  -H "Content-Type: application/json" \
  -d '{
    "plantId": "plant-uuid-123"
  }'
```

---

## 🐳 Inicio con Docker

### Opción 1: Solo el microservicio

```bash
# Construir imagen
docker build -t api-orchard .

# Ejecutar
docker run -d \
  -p 3004:3004 \
  --name api-orchard \
  -e MONGO_URI=mongodb://host.docker.internal:27017/planty_orchards \
  api-orchard
```

### Opción 2: Con Docker Compose (Recomendado)

Desde la raíz del proyecto:

```bash
# Iniciar todos los servicios
docker-compose up -d

# Solo el servicio de orchards
docker-compose up -d api-orchard

# Ver logs
docker-compose logs -f api-orchard
```

---

## 📋 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check general |
| GET | `/info` | Info del sistema |
| GET | `/orchards/health` | Health del servicio |
| POST | `/orchards` | Crear huerto |
| GET | `/orchards` | Listar huertos |
| GET | `/orchards?active=true` | Listar activos |
| GET | `/orchards/:id` | Obtener por ID |
| PUT | `/orchards/:id` | Actualizar |
| DELETE | `/orchards/:id` | Eliminar |
| PATCH | `/orchards/:id/activate` | Activar |
| PATCH | `/orchards/:id/deactivate` | Desactivar |
| POST | `/orchards/:id/plants` | Agregar planta |
| DELETE | `/orchards/:id/plants/:plantId` | Remover planta |

---

## 🔧 Variables de Entorno

El archivo `.env` ya está configurado con valores por defecto:

```env
PORT=3004
NODE_ENV=development
CORS_ORIGIN=*
MONGO_URI=mongodb://localhost:27017/planty_orchards
MONGO_DB_NAME=planty_orchards
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Ejemplo Completo de Flujo

```bash
# 1. Crear huerto
ORCHARD_ID=$(curl -s -X POST http://localhost:3004/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto Demo",
    "description": "Huerto de demostración",
    "width": 20,
    "height": 15
  }' | jq -r '.data._id')

echo "Huerto creado: $ORCHARD_ID"

# 2. Agregar plantas
curl -X POST http://localhost:3004/orchards/$ORCHARD_ID/plants \
  -H "Content-Type: application/json" \
  -d '{"plantId": "planta-001"}'

curl -X POST http://localhost:3004/orchards/$ORCHARD_ID/plants \
  -H "Content-Type: application/json" \
  -d '{"plantId": "planta-002"}'

# 3. Ver huerto actualizado
curl http://localhost:3004/orchards/$ORCHARD_ID | jq

# 4. Actualizar huerto
curl -X PUT http://localhost:3004/orchards/$ORCHARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto Demo Actualizado",
    "width": 25
  }' | jq

# 5. Listar todos los huertos
curl http://localhost:3004/orchards | jq
```

---

## 🛠️ Scripts NPM

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Producción (requiere build)
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to MongoDB

**Solución:**
```bash
# Verificar que MongoDB esté corriendo
mongosh

# O iniciar con Docker
docker run -d -p 27017:27017 mongo:7.0
```

### Error: Port 3004 already in use

**Solución:**
```bash
# Cambiar puerto en .env
PORT=3005
```

### Error: Module not found

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación completa
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen técnico
- [ARCHITECTURE_REPORT.md](../ARCHITECTURE_REPORT.md) - Arquitectura del proyecto

---

## ✅ Checklist de Verificación

- [ ] MongoDB está corriendo
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Servidor inicia sin errores (`npm run dev`)
- [ ] Health check responde correctamente
- [ ] Puedo crear un huerto de prueba
- [ ] Puedo listar los huertos

---

## 🎉 ¡Listo!

Si todos los pasos funcionan correctamente, tu microservicio **api-orchard** está completamente operativo y listo para integrarse con el resto del sistema Planty.

**Puerto:** 3004
**Status:** ✅ Operacional
