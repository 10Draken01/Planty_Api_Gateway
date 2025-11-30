# PlantGen Recommender Service

Microservicio de recomendaciones de huertos mediante **Clustering No Supervisado con K-Prototypes**.

## Justificación Técnica

### Librerías Elegidas

**Python 3.11+ con FastAPI**: Ecosistema ML más estable y maduro. FastAPI ofrece alto rendimiento (async), validación automática con Pydantic y documentación OpenAPI integrada.

**scikit-learn + kmodes (K-Prototypes)**: K-Prototypes maneja datos mixtos (numéricos + categóricos) sin necesidad de one-hot encoding completo, preservando la naturaleza de variables categóricas (objective, cluster_region) mientras optimiza sobre features numéricas (área, agua, mantenimiento). Esto reduce dimensionalidad y mejora interpretabilidad.

**Motor (async MongoDB)**: Cliente asíncrono que se integra perfectamente con FastAPI para operaciones no bloqueantes en base de datos.

**APScheduler**: Scheduler robusto para jobs periódicos (reentrenamiento mensual, recomendaciones semanales) con soporte para persistencia y recuperación de fallos.

### Algoritmo Principal

**K-Prototypes**:
- Extensión de K-Means que maneja variables categóricas mediante distancia de disimilaridad
- Óptimo para perfiles de usuario mixtos (experiencia=numérica, objetivo=categórica)
- Convergencia garantizada con inicialización Huang
- Silhouette score para validación interna del clustering

**Fallback MiniBatchKMeans**: Para datasets >50k usuarios, entrenamiento incremental con menor uso de memoria.

---

## Instalación Rápida

### Prerequisitos

- Python 3.11+
- MongoDB 7.0+
- Node.js 18+ (para DB_fill)

### 1. Instalar Dependencias

```bash
cd recommender
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus valores de MongoDB y servicios
```

### 3. Iniciar MongoDB

```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  --name plantgen-mongodb mongo:7.0
```

### 4. Iniciar Servicio

```bash
# Desarrollo
uvicorn app.main:app --reload --port 8000

# Producción
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

La API estará disponible en `http://localhost:8000`

Documentación interactiva: `http://localhost:8000/docs`

---

## Uso del Servicio

### Health Check

```bash
curl http://localhost:8000/
```

### Entrenar Modelo Inicial

```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "n_clusters": 8,
  "n_users_clustered": 1543,
  "silhouette_score": 0.42,
  "trained_at": "2024-01-15T10:30:00"
}
```

### Obtener Estado del Modelo

```bash
curl http://localhost:8000/status
```

### Ver Información de Clusters

```bash
curl http://localhost:8000/clusters
```

### Obtener Recomendaciones para Usuario

```bash
curl http://localhost:8000/recommendations/user/USER_ID_HERE?limit=5
```

**Respuesta:**
```json
{
  "userId": "user-123",
  "clusterIdAssigned": 3,
  "recommendations": [
    {
      "orchardId": "orchard-456",
      "name": "Huerto Medicinal Compacto",
      "shortDescription": "3 plantas medicinales, 1.5m², bajo mantenimiento",
      "estimatedWeeklyWater": 45.5,
      "maintenanceMinutes": 60,
      "fitness": 0.87,
      "score": 0.92
    }
  ],
  "generatedAt": "2024-01-15T10:35:00"
}
```

---

## Generación Masiva de Datos (DB_fill)

El script `DB_fill` genera 100,000 usuarios y huertos de prueba.

### Configuración

```bash
cd ../DB_fill
npm install
```

### Ejecución

```bash
# Generar 1000 usuarios de prueba (rápido)
npm run generate -- --count 1000 --concurrency 50

# Generar 100,000 usuarios completos
npm run generate -- --count 100000 --concurrency 200

# Reanudar desde checkpoint
npm run generate -- --count 100000 --resume checkpoint.json
```

**Flags disponibles:**
- `--count <N>`: Número de usuarios a generar (default: 1000)
- `--concurrency <N>`: Requests paralelos (default: 50)
- `--resume <file>`: Archivo de checkpoint para reanudar
- `--batch-size <N>`: Tamaño de batch (default: 200)

### Flujo de Generación

1. Genera usuario con `@faker-js/faker`
2. Hashea contraseña con bcrypt (salt rounds=12)
3. Crea usuario en DB via `POST /users`
4. Llama `POST http://localhost:3005/v1/generate` (AG Service)
5. Crea orchards via `POST /orchards` con datos del AG
6. Guarda checkpoint cada 500 usuarios

---

## Migración de Esquema

Antes de usar el recommender, ejecutar migración de esquema:

```bash
cd migrations
python migrate_schema.py
```

**Cambios aplicados:**
1. Elimina `orchards_id` de users (con backup)
2. Añade `userId` a orchards
3. Añade `max_orchards: 3` a users
4. Crea índices optimizados

---

## Features Utilizadas para Clustering

### Features de Usuario (11 numéricas)
- `experience_level`: 1, 2, 3
- `count_orchards`: Número de huertos actuales
- `has_tokenFCM`: 0/1 (push notifications habilitadas)
- `profile_image_present`: 0/1
- `account_age_days`: Días desde registro

### Features Agregadas de Orchards (11 numéricas)
- `avg_orchard_area`: Área promedio en m²
- `sum_weekly_water_liters`: Agua total semanal
- `avg_maintenance_minutes`: Mantenimiento promedio/semana
- `avg_count_plants`: Plantas promedio por huerto
- `avg_timeOfLife`: Días de vida promedio
- `avg_streak`: Racha de cuidado promedio
- `avg_plant_diversity`: Tipos de plantas distintos
- `pct_vegetable`, `pct_medicinal`, `pct_ornamental`, `pct_aromatic`: Distribución de categorías

### Features Categóricas (2)
- `objective`: alimenticio, medicinal, sostenible, ornamental
- `cluster_region`: Región geográfica (discretizada de lat/lon con KMeans)

**Preprocesamiento:**
- Numéricos: StandardScaler (media=0, std=1)
- Nulos numéricos: Rellenar con mediana o 0
- Categóricos: Codificación ordinal para k-prototypes
- Ubicación: Discretizada en 10 regiones con KMeans

---

## Scheduler - Jobs Automáticos

### Reentrenamiento Mensual

- **Trigger**: Día 1 de cada mes a las 2:00 AM
- **Acción**: Reentrenar modelo con todos los usuarios
- **Condición**: Si cambios > 15% del dataset, reentrenar completo; sino, incremental

### Recomendaciones Semanales

- **Trigger**: Lunes 9:00 AM
- **Acción**: Generar recomendaciones para cada usuario y enviar notificación push
- **Filtro**: Solo usuarios con `tokenFCM` presente

### Usuario Nuevo Registrado

- **Trigger**: Webhook `POST /webhook/user-registered`
- **Acción**: Asignar cluster inmediatamente y enviar primera recomendación

---

## Algoritmo de Recomendación

Para cada usuario:

1. Obtener `cluster_id` del usuario
2. Buscar orchards de otros usuarios del mismo cluster
3. Excluir orchards ya poseídos por el usuario
4. Calcular score: `similarity(user_profile, orchard_vector) * clusterAffinity + freshness_factor`
5. Retornar top N orchards con mayor score

**Factores del Score:**
- Similaridad de perfil (cosine similarity sobre features)
- Afinidad del cluster (usuarios del mismo cluster)
- Frescura (orchards recientes tienen boost)

---

## Endpoints Protegidos (Admin)

Generar JWT de admin:

```python
from jose import jwt
from datetime import datetime, timedelta

payload = {"sub": "admin", "exp": datetime.utcnow() + timedelta(hours=24)}
token = jwt.encode(payload, "your-secret-key", algorithm="HS256")
print(token)
```

Usar token en requests:

```bash
curl -X POST http://localhost:8000/train \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Endpoints protegidos:**
- `POST /train`
- `POST /notify/cluster/{cluster_id}`

---

## Testing

### Tests Unitarios

```bash
pytest tests/ -v

# Con coverage
pytest tests/ --cov=app --cov-report=html
```

### Tests de Integración

```bash
pytest tests/integration/ -v
```

**Tests incluidos:**
- Pipeline de features
- Clustering service
- Endpoints de API (mockeados)
- Webhook de usuario registrado

---

## Estructura del Proyecto

```
recommender/
├── app/
│   ├── api/
│   │   ├── routes.py          # Endpoints FastAPI
│   │   ├── schemas.py         # Pydantic models
│   │   └── deps.py            # Dependencias (auth, DB)
│   ├── core/
│   │   └── config.py          # Configuración
│   ├── services/
│   │   ├── feature_pipeline.py     # Extracción de features
│   │   ├── clustering_service.py   # K-Prototypes
│   │   ├── training_service.py     # Orquestación de training
│   │   ├── recommendation_service.py # Generación de recomendaciones
│   │   └── scheduler.py            # APScheduler jobs
│   └── main.py                # App FastAPI
├── tests/                     # Tests con pytest
├── migrations/                # Scripts de migración
├── models/                    # Modelos serializados (generados)
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

---

## Docker

### Build

```bash
docker build -t plantgen-recommender .
```

### Run

```bash
docker run -d -p 8000:8000 \
  -e MONGO_URI=mongodb://admin:password123@host.docker.internal:27017/plantgen \
  --name recommender plantgen-recommender
```

### Docker Compose

```bash
docker-compose up -d
```

---

## Observabilidad

### Logs

Logs estructurados en consola con nivel configurable via `LOG_LEVEL`.

```bash
# Ver logs en producción
tail -f /var/log/recommender.log
```

### Métricas de Entrenamiento

Guardadas en colección `training_history`:
- `silhouette_score`
- `n_clusters`
- `cluster_sizes`
- `timestamp`
- `duration_seconds`

### Health Check Avanzado

```bash
curl http://localhost:8000/status
```

---

## Troubleshooting

### Error: "Model not trained"

```bash
# Entrenar modelo inicial
curl -X POST http://localhost:8000/train
```

### Error: "MongoDB connection failed"

Verificar que MongoDB esté corriendo y accesible:

```bash
docker ps | grep mongo
mongo --host localhost --port 27017 -u admin -p password123
```

### Recomendaciones vacías

- Verificar que existen orchards en la BD
- Verificar que el usuario tiene `cluster_id` asignado
- Revisar logs para errores de similarity calculation

### DB_fill muy lento

- Aumentar `--concurrency` (recomendado: 200)
- Reducir `--batch-size` si hay errores de conexión
- Verificar que AG Service (`localhost:3005`) esté respondiendo

---

## Próximos Pasos

1. Ejecutar migración de esquema
2. Generar datos de prueba con DB_fill (1000 usuarios)
3. Entrenar modelo inicial
4. Probar recomendaciones para usuarios
5. Configurar jobs automáticos (scheduler)

---

## Contacto

PlantGen Team - plantgen@example.com

## Licencia

MIT License
