# Integración con API Gateway - PlantGen (Algoritmo Genético)

## Estado: INTEGRADO

El microservicio **PlantGen API** (Algoritmo Genético) está completamente integrado con el **API Gateway** de Planty.

---

## Cambios Realizados

### 1. Archivo requirements.txt creado

Se creó el archivo `requirements.txt` con todas las dependencias necesarias:

```txt
# FastAPI Framework y servidor ASGI
fastapi==0.109.2
uvicorn[standard]==0.27.0

# MongoDB - Driver asíncrono
motor==3.3.2
pymongo==4.6.1

# Validación de datos
pydantic==2.6.1
pydantic-settings==2.1.0

# Utilities
python-dotenv==1.0.0

# Logging mejorado
python-json-logger==2.0.7

# HTTP client (para health checks en Docker)
requests==2.31.0
```

### 2. Proxy Service Agregado

Se agregó el proxy en `api-gateway/src/services/proxy.ts`:

```typescript
export const algorithmGenServiceProxy = createProxyMiddleware({
  target: process.env.ALGORITHM_GEN_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/algorithm-gen': '/algorithm_gen' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    const user = (req as any).user;
    if (user) {
      proxyReq.setHeader('X-User-Id', user.userId);
      proxyReq.setHeader('X-User-Email', user.email);
    }

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
});
```

### 3. Ruta Agregada en API Gateway

Se agregó la ruta en `api-gateway/src/routes/index.ts`:

```typescript
// Ruta para el servicio de Algoritmo Genético (PlantGen)
router.use('/algorithm-gen', algorithmGenServiceProxy);
// router.use('/algorithm-gen', validateTokenWithAuthService, algorithmGenServiceProxy); // Con autenticación
```

### 4. Variables de Entorno Actualizadas

**Archivo: `api-gateway/.env.example`**
```env
# URL del microservicio de algoritmo genético (PlantGen)
ALGORITHM_GEN_SERVICE_URL=http://localhost:3005
```

**Archivo: `api-gateway/.env`**
```env
ALGORITHM_GEN_SERVICE_URL=http://localhost:3005
```

### 5. Docker Compose Actualizado

Se agregó el servicio en `docker-compose.yml`:

```yaml
# Algorithm Genetic Service (PlantGen)
api-algorithm-gen:
  build:
    context: ./Proyecto_AG_C2
    dockerfile: Dockerfile
  container_name: planty-api-algorithm-gen
  restart: unless-stopped
  ports:
    - "3005:3005"
  environment:
    - MONGO_ROOT_USER=${MONGO_ROOT_USER:-admin}
    - MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:-password123}
    - MONGO_HOST=mongodb
    - MONGO_PORT=27017
    - MONGO_DATABASE=Data_plants
    - PORT=3005
    - ENVIRONMENT=production
    - LOG_LEVEL=INFO
  depends_on:
    mongodb:
      condition: service_healthy
  networks:
    - planty-network
  healthcheck:
    test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:3005/algorithm_gen/health')"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

Y se agregó la dependencia en el API Gateway:

```yaml
api-gateway:
  environment:
    - ALGORITHM_GEN_SERVICE_URL=http://api-algorithm-gen:3005
  depends_on:
    # ... otros servicios
    api-algorithm-gen:
      condition: service_healthy
```

---

## Endpoints Disponibles a través del Gateway

### Mapeo de Rutas

| Gateway Endpoint | Microservicio Endpoint | Método | Descripción |
|-----------------|------------------------|--------|-------------|
| `GET /api/algorithm-gen/health` | `GET /algorithm_gen/health` | GET | Health check del servicio |
| `POST /api/algorithm-gen/generate` | `POST /algorithm_gen/generate` | POST | Generar configuración de huerto optimizada |

---

## Instalación de Dependencias

### Opción 1: Instalación Local (para desarrollo)

```bash
cd Proyecto_AG_C2

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Opción 2: Docker (para producción)

Las dependencias se instalan automáticamente al construir la imagen Docker.

```bash
# Construir la imagen
docker build -t planty-api-algorithm-gen:latest ./Proyecto_AG_C2

# O usar docker-compose
docker-compose build api-algorithm-gen
```

---

## Cómo Probar la Integración

### Opción 1: Desarrollo Local (Sin Docker)

#### Terminal 1: MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:latest
```

#### Terminal 2: Cargar datos a MongoDB
```bash
cd Proyecto_AG_C2
python scripts/load_data_to_mongodb.py
```

#### Terminal 3: API PlantGen
```bash
cd Proyecto_AG_C2
python main.py
# Corre en puerto 3005
```

#### Terminal 4: API Gateway
```bash
cd api-gateway
npm install
npm run dev
# Corre en puerto 3000
```

#### Terminal 5: Probar
```bash
# Health check a través del Gateway
curl http://localhost:3000/api/algorithm-gen/health

# Generar huerto a través del Gateway
curl -X POST http://localhost:3000/api/algorithm-gen/generate \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "alimenticio",
    "area": 2.0,
    "max_water": 150.0,
    "budget": 400.0,
    "maintenance_time": 90,
    "population_size": 40,
    "max_generations": 150
  }'
```

### Opción 2: Con Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Cargar datos a MongoDB (solo la primera vez)
docker exec -it planty-api-algorithm-gen python scripts/load_data_to_mongodb.py
```

#### Probar:
```bash
# Health check a través del Gateway (puerto 3000)
curl http://localhost:3000/api/algorithm-gen/health

# Generar huerto optimizado
curl -X POST http://localhost:3000/api/algorithm-gen/generate \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "medicinal",
    "area": 3.0,
    "max_water": 180.0,
    "budget": 500.0,
    "maintenance_time": 120,
    "population_size": 40,
    "max_generations": 150
  }'
```

---

## Autenticación (Opcional)

Por defecto, las rutas del algoritmo genético **NO requieren autenticación**. Si deseas habilitarla:

### Editar `api-gateway/src/routes/index.ts`

Cambiar de:
```typescript
router.use('/algorithm-gen', algorithmGenServiceProxy);
```

A:
```typescript
router.use('/algorithm-gen', validateTokenWithAuthService, algorithmGenServiceProxy);
```

### Usar con Token JWT

```bash
# 1. Login para obtener token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.token')

# 2. Usar el token en las peticiones
curl -X POST http://localhost:3000/api/algorithm-gen/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "sostenible",
    "area": 2.5,
    "max_water": 160.0,
    "budget": 450.0,
    "maintenance_time": 100
  }'
```

---

## Flujo de Peticiones

```
Cliente
   ↓
   POST http://localhost:3000/api/algorithm-gen/generate
   ↓
API Gateway (puerto 3000)
   ├── Valida JWT (si está habilitado)
   ├── Rate Limiting
   ├── CORS
   └── Proxy → http://api-algorithm-gen:3005/algorithm_gen/generate
       ↓
api-algorithm-gen (puerto 3005) - Python FastAPI
   ├── GardenController
   ├── GenerateGardenUseCase
   ├── GeneticAlgorithm (Domain Service)
   ├── PlantRepository (MongoDB)
   └── CompatibilityRepository (MongoDB)
       ↓
   Respuesta JSON con Top 3 configuraciones
```

---

## Parámetros del Algoritmo Genético

### Request Body

```json
{
  "objective": "alimenticio | medicinal | sostenible | ornamental",
  "area": 2.0,              // m² (1.0 - 5.0)
  "max_water": 150.0,       // L/semana (80 - 200)
  "budget": 400.0,          // MXN (200 - 800)
  "maintenance_time": 90,   // min/semana (≥ 30)
  "population_size": 40,    // Individuos (10 - 100)
  "max_generations": 150    // Generaciones (50 - 500)
}
```

### Response (Top 3 Soluciones)

```json
{
  "success": true,
  "message": "Se generaron 3 configuraciones de huerto exitosamente",
  "solutions": [
    {
      "rank": 1,
      "layout": [[1, 8, null], [11, 1, 8]],
      "width": 1.41,
      "height": 1.41,
      "fitness": 0.873,
      "cee": 0.850,
      "psntpa": 0.920,
      "wce": 0.780,
      "ue": 0.820,
      "plants": [...],
      "total_plants": 12,
      "total_water_weekly": 145.5,
      "total_area_used": 1.85,
      "total_cost": 380.0
    }
  ],
  "generations_executed": 87,
  "execution_time_seconds": 2.34
}
```

---

## Librería de Python Necesarias

Todas las librerías están listadas en `requirements.txt`:

1. **FastAPI** (0.109.2) - Framework web moderno
2. **Uvicorn** (0.27.0) - Servidor ASGI para FastAPI
3. **Motor** (3.3.2) - Driver async de MongoDB
4. **PyMongo** (4.6.1) - Cliente de MongoDB
5. **Pydantic** (2.6.1) - Validación de datos
6. **pydantic-settings** (2.1.0) - Gestión de configuración
7. **python-dotenv** (1.0.0) - Carga de variables de entorno
8. **python-json-logger** (2.0.7) - Logging estructurado
9. **requests** (2.31.0) - Cliente HTTP para health checks

---

## Checklist de Verificación

- [x] `requirements.txt` creado con todas las dependencias
- [x] Proxy agregado en `api-gateway/src/services/proxy.ts`
- [x] Ruta agregada en `api-gateway/src/routes/index.ts`
- [x] Variable de entorno `ALGORITHM_GEN_SERVICE_URL` configurada
- [x] Docker Compose actualizado con servicio `api-algorithm-gen`
- [x] API Gateway depende de `api-algorithm-gen`
- [x] Health checks configurados
- [x] Documentación de integración creada

---

## Ventajas de la Integración

1. **Punto de entrada único** - Todos los servicios a través del puerto 3000
2. **Autenticación centralizada** - JWT validado en el gateway (opcional)
3. **Rate limiting** - Protección contra abuso
4. **CORS** - Configuración centralizada
5. **Logs** - Monitoreo centralizado
6. **Escalabilidad** - Microservicio independiente en Python
7. **Algoritmo Genético Multi-Objetivo** - Optimización de 4 métricas simultáneas

---

## Documentación Adicional

- [README del Microservicio](./README.md)
- [QUICK START](./QUICKSTART.md)
- [INSTRUCCIONES DE PRUEBA](./INSTRUCCIONES_PRUEBA.md)

---

## Conclusión

La integración está **100% completa**. Ahora puedes acceder a todos los endpoints del algoritmo genético PlantGen a través del API Gateway en:

**http://localhost:3000/api/algorithm-gen**

¡Todo listo para optimizar huertos! 🌱🧬
