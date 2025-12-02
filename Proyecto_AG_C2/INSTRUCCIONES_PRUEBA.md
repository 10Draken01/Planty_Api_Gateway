# 🧪 Instrucciones de Prueba - PlantGen API

## Pasos para probar el microservicio completo

---

## 📋 Pre-requisitos

Asegúrate de tener instalado:
- ✅ Python 3.11 o superior
- ✅ Docker
- ✅ pip
- ✅ curl (o Postman para pruebas)

---

## 🚀 Paso 1: Iniciar MongoDB

Ejecuta el siguiente comando para iniciar MongoDB con Docker:

```bash
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=TuPassword123! \
  mongo:latest
```

**Verificar que MongoDB está corriendo:**

```bash
docker ps
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE          STATUS         PORTS                      NAMES
abc123def456   mongo:latest   Up 5 seconds   0.0.0.0:27017->27017/tcp   mongodb
```

---

## 📦 Paso 2: Instalar Dependencias

```bash
cd PlantGen-API
pip install -r requirements.txt
```

**Salida esperada:**
```
Successfully installed fastapi-0.109.2 uvicorn-0.27.1 motor-3.3.2 ...
```

---

## 💾 Paso 3: Cargar Datos a MongoDB

```bash
python scripts/load_data_to_mongodb.py
```

**Salida esperada:**

```
============================================================
  Script de Carga de Datos a MongoDB - PlantGen
============================================================

📊 Configuración MongoDB:
  - Host: localhost:27017
  - Usuario: admin
  - Base de datos: Data_plants

🔌 Conectando a MongoDB...
✓ Conexión exitosa

📁 Cargando plantas desde: .../data/plants_with_id.json
✓ Se cargaron 50 plantas
  - Se eliminaron 0 documentos existentes
✓ Se insertaron 50 plantas en colección 'Plants'
✓ Índices creados: id (único), species (único)

📁 Cargando matriz de compatibilidad desde: .../data/matriz_compatibilities.json
✓ Se cargó matriz con 50 plantas

🔄 Transformando matriz a pares...
✓ Se generaron 1275 pares de compatibilidad
  - Se eliminaron 0 documentos existentes
✓ Se insertaron 1275 pares en colección 'Matriz'
✓ Índices creados: (plant1, plant2) único, plant1, plant2

✅ Verificación final:
  - Colección 'Plants': 50 documentos
  - Colección 'Matriz': 1275 documentos

📋 Ejemplo de planta:
  ID: 1
  Especie: Cilantro
  Nombre científico: Coriandrum sativum
  Tipos: aromatic, medicinal, vegetable

📋 Ejemplo de par de compatibilidad:
  Cilantro + Tomate Cherry: 1.0

============================================================
✅ Carga de datos completada exitosamente
============================================================
```

---

## 🌐 Paso 4: Iniciar la API

```bash
python main.py
```

**Salida esperada:**

```
╔═══════════════════════════════════════════════════╗
║           PlantGen API - Microservicio            ║
║    Optimización de Huertos Urbanos con AG         ║
╠═══════════════════════════════════════════════════╣
║  Puerto: 3005                                      ║
║  Docs: http://localhost:3005/docs                  ║
║  Health: http://localhost:3005/api/v1/health       ║
╚═══════════════════════════════════════════════════╝

🚀 Iniciando PlantGen API...
✓ Conectado exitosamente a MongoDB: Data_plants
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3005 (Press CTRL+C to quit)
```

**¡NO CIERRES ESTA TERMINAL!** Deja el servidor corriendo.

---

## ✅ Paso 5: Pruebas de Funcionalidad

Abre una **NUEVA TERMINAL** para ejecutar las pruebas.

### Prueba 1: Health Check

```bash
curl http://localhost:3005/api/v1/health
```

**Resultado esperado:**

```json
{
  "status": "healthy",
  "service": "PlantGen API",
  "version": "1.0.0",
  "database": "connected",
  "plants_count": 50,
  "compatibility_pairs_count": 1275
}
```

✅ Si obtienes esta respuesta, el servicio está funcionando correctamente.

---

### Prueba 2: Generar Huerto Alimenticio

```bash
curl -X POST "http://localhost:3005/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "alimenticio",
    "area": 2.0,
    "max_water": 150.0,
    "budget": 400.0,
    "maintenance_time": 90
  }'
```

**Resultado esperado (parcial):**

```json
{
  "success": true,
  "message": "Se generaron 3 configuraciones de huerto exitosamente",
  "solutions": [
    {
      "rank": 1,
      "layout": [[1, 8, null], [11, 1, 8], ...],
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
      "total_cost": 380.0,
      "estimated_production_monthly": 10.5,
      "planting_calendar": [...]
    }
    // ... 2 soluciones más
  ],
  "generations_executed": 87,
  "convergence_reason": "Sin mejora en 20 generaciones",
  "execution_time_seconds": 2.34
}
```

✅ Verifica que:
- `success` es `true`
- Hay 3 soluciones en el array `solutions`
- Cada solución tiene valores de fitness entre 0 y 1
- El tiempo de ejecución es razonable (< 10 segundos)

---

### Prueba 3: Huerto Medicinal

```bash
curl -X POST "http://localhost:3005/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "medicinal",
    "area": 3.0,
    "max_water": 180.0,
    "budget": 600.0
  }'
```

✅ Verifica que los pesos son diferentes (medicinal prioriza plantas medicinales).

---

### Prueba 4: Huerto Sostenible

```bash
curl -X POST "http://localhost:3005/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "sostenible",
    "area": 2.5,
    "max_water": 100.0,
    "budget": 500.0
  }'
```

✅ Verifica que `wce` (eficiencia hídrica) tiene mayor peso.

---

### Prueba 5: Huerto Ornamental

```bash
curl -X POST "http://localhost:3005/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "ornamental",
    "area": 1.5,
    "max_water": 120.0,
    "budget": 300.0
  }'
```

✅ Verifica que las plantas ornamentales son priorizadas.

---

## 📊 Paso 6: Prueba Interactiva con Swagger

1. Abre tu navegador en: **http://localhost:3005/docs**

2. Verás la documentación interactiva de Swagger UI

3. Prueba el endpoint `/api/v1/health`:
   - Click en "GET /api/v1/health"
   - Click en "Try it out"
   - Click en "Execute"
   - Verifica la respuesta

4. Prueba el endpoint `/api/v1/generate`:
   - Click en "POST /api/v1/generate"
   - Click en "Try it out"
   - Modifica los valores del JSON de ejemplo
   - Click en "Execute"
   - Analiza las 3 soluciones retornadas

---

## 🐳 Paso 7 (Opcional): Prueba con Docker

### Construir la imagen Docker

```bash
cd PlantGen-API
docker build -t plantgen-api:1.0.0 .
```

**Salida esperada:**
```
[+] Building 45.2s (12/12) FINISHED
 => [1/6] FROM python:3.11-slim
 => [2/6] WORKDIR /app
 => [3/6] COPY requirements.txt .
 => [4/6] RUN pip install --upgrade pip && pip install -r requirements.txt
 => [5/6] COPY . .
 => [6/6] RUN useradd -m -u 1000 plantgen && chown -R plantgen:plantgen /app
 => exporting to image
Successfully tagged plantgen-api:1.0.0
```

### Ejecutar el contenedor

```bash
docker run -d -p 3005:3005 --name plantgen-api --env-file .env plantgen-api:1.0.0
```

### Ver logs del contenedor

```bash
docker logs -f plantgen-api
```

### Probar el contenedor

```bash
curl http://localhost:3005/api/v1/health
```

---

## 🔍 Validaciones de las Pruebas

| Prueba | Criterio de Éxito |
|--------|-------------------|
| Health Check | `status: "healthy"` y `plants_count: 50` |
| Generar Alimenticio | `fitness > 0.5`, `solutions.length == 3` |
| Generar Medicinal | Plantas medicinales priorizadas |
| Generar Sostenible | `wce` (eficiencia hídrica) alta |
| Generar Ornamental | Plantas ornamentales en resultados |
| Swagger UI | Documentación accesible y funcional |
| Docker | Contenedor inicia sin errores |

---

## ❌ Troubleshooting

### Error: "MongoDB no disponible"

**Solución:**
```bash
docker ps  # Verificar que MongoDB está corriendo
docker start mongodb  # Si no está, iniciarlo
```

### Error: "No se encontraron plantas"

**Solución:**
```bash
python scripts/load_data_to_mongodb.py  # Re-ejecutar carga de datos
```

### Error: "Port 3005 already in use"

**Solución:**
```bash
# Cambiar puerto en .env
PORT=3006

# O matar el proceso que usa el puerto
# Windows:
netstat -ano | findstr :3005
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3005 | xargs kill -9
```

### Error: "ModuleNotFoundError"

**Solución:**
```bash
pip install -r requirements.txt
```

---

## 📈 Métricas Esperadas

Al ejecutar `/generate`, deberías obtener:

- **Tiempo de ejecución**: 1-5 segundos
- **Generaciones ejecutadas**: 50-150
- **Fitness de mejor solución**: > 0.7
- **3 soluciones diferentes**: ranks 1, 2, 3
- **Plantas totales**: 5-20 plantas por solución
- **Agua utilizada**: < max_water especificado
- **Costo total**: < budget especificado

---

## ✅ Checklist Final de Pruebas

- [ ] MongoDB iniciado correctamente
- [ ] Datos cargados (50 plantas, 1275 pares)
- [ ] API iniciada en puerto 3005
- [ ] Health check retorna "healthy"
- [ ] Endpoint /generate funciona con objetivo "alimenticio"
- [ ] Endpoint /generate funciona con objetivo "medicinal"
- [ ] Endpoint /generate funciona con objetivo "sostenible"
- [ ] Endpoint /generate funciona con objetivo "ornamental"
- [ ] Swagger UI accesible y funcional
- [ ] Docker build exitoso (opcional)
- [ ] Docker run exitoso (opcional)

---

## 🎉 ¡Pruebas Completadas!

Si todas las pruebas pasaron, el microservicio PlantGen API está funcionando correctamente y listo para usar.

**Siguiente paso**: Analiza las soluciones generadas y compara las métricas entre diferentes objetivos.
