# 🌱 Planty Recommender API - Guía de Uso

Sistema de recomendaciones de huertos basado en Machine Learning con clustering multi-algoritmo.

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Modelos y Entrenamiento](#modelos-y-entrenamiento)
- [Integración con Otros Servicios](#integración-con-otros-servicios)

---

## Descripción General

El **Recommender Service** es un microservicio de Machine Learning que genera recomendaciones personalizadas de huertos para usuarios de Planty. Utiliza clustering con 3 algoritmos diferentes (K-Prototypes, DBSCAN, GMM) y selecciona automáticamente el mejor modelo.

### Características Principales
- ✅ Clustering multi-algoritmo con selección automática del mejor modelo
- ✅ Reentrenamiento automático semestral (1 de enero y 1 de julio)
- ✅ Pipeline de features avanzado con datos agregados
- ✅ Integración con Planty (chatbot) para mensajes personalizados
- ✅ Persistencia de modelos con versionado por fecha
- ✅ API RESTful con FastAPI

---

## Arquitectura

```
┌─────────────────┐
│   API Gateway   │ :3000
│  /api/recommender
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ api-recommender │ :3008
│   (FastAPI)     │
└────────┬────────┘
         │
         ├──► api-users :3001     (obtener usuarios)
         ├──► api-orchard :3004   (obtener huertos)
         ├──► api-chatbot :3003   (generar mensajes)
         └──► MongoDB             (guardar historial)
```

### Algoritmos de Clustering
1. **K-Prototypes**: Clustering para datos mixtos (numéricos + categóricos)
2. **DBSCAN**: Clustering basado en densidad
3. **GMM**: Gaussian Mixture Model (clustering probabilístico)

El sistema selecciona automáticamente el mejor algoritmo usando **Silhouette Score**.

---

## Endpoints Disponibles

### Base URL
- **Local**: `http://localhost:3008`
- **Gateway**: `http://localhost:3000/api/recommender`

---

## 1. Entrenar Modelo

**Endpoint**: `POST /train`

Entrena un nuevo modelo de clustering con datos históricos de 6 meses.

### Request
```bash
# Sin parámetros (usa fecha actual)
curl -X POST http://localhost:3000/api/recommender/train \
  -H "Authorization: Bearer YOUR_TOKEN"

# Con fecha específica
curl -X POST "http://localhost:3000/api/recommender/train?training_date=2024-12-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Parámetros
- `training_date` (opcional): Fecha en formato `YYYY-MM-DD`. Si no se proporciona, usa la fecha actual.
- El modelo se entrena con 6 meses de datos **antes** de esta fecha.

### Response
```json
{
  "success": true,
  "message": "Modelo entrenado exitosamente",
  "algorithm": "k-prototypes",
  "n_clusters": 4,
  "silhouette_score": 0.4523,
  "training_date": "2024-12-01",
  "n_users_trained": 156,
  "features_used": {
    "numerical": 12,
    "categorical": 2
  },
  "model_file": "model_2024-12-01.pkl",
  "trained_at": "2024-12-01T10:30:00.000Z"
}
```

---

## 2. Obtener Recomendaciones

**Endpoint**: `POST /recommend/{user_id}`

Genera recomendaciones personalizadas para un usuario.

### Request
```bash
curl -X POST "http://localhost:3000/api/recommender/recommend/675a1234abcd5678ef901234?limit=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Parámetros
- `user_id` (path): ID del usuario
- `limit` (query, opcional): Número de recomendaciones (1-10, default: 3)

### Response
```json
{
  "success": true,
  "user_id": "675a1234abcd5678ef901234",
  "cluster_id": 2,
  "recommendations": [
    {
      "_id": "675b9876fedc5432ba109876",
      "name": "Huerto Orgánico Los Pinos",
      "userId": "675a5678abcd1234ef905678",
      "surface": 150.5,
      "numPlants": 45,
      "numPlantTypes": 8,
      "avgPlantAge": 120.5,
      "owner_name": "María García",
      "similarity_score": 0.89
    },
    {
      "_id": "675c4321dcba8765fe214321",
      "name": "Jardín Vertical Urbano",
      "userId": "675a8765dcba4321fe908765",
      "surface": 80.0,
      "numPlants": 32,
      "numPlantTypes": 6,
      "avgPlantAge": 90.2,
      "owner_name": "Carlos Ruiz",
      "similarity_score": 0.85
    },
    {
      "_id": "675d8765abcd9876ba328765",
      "name": "Huerto Comunitario La Esperanza",
      "userId": "675a9876fedc5678ab129876",
      "surface": 200.0,
      "numPlants": 60,
      "numPlantTypes": 12,
      "avgPlantAge": 150.8,
      "owner_name": "Ana López",
      "similarity_score": 0.82
    }
  ],
  "generated_at": "2024-12-01T14:30:00.000Z"
}
```

---

## 3. Endpoint de Prueba Completo

**Endpoint**: `POST /test/{user_id}`

Endpoint de testing que retorna datos completos del usuario, huertos actuales, recomendaciones y mensajes generados por Planty.

### Request
```bash
curl -X POST http://localhost:3000/api/recommender/test/675a1234abcd5678ef901234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "user": {
    "_id": "675a1234abcd5678ef901234",
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "country": "México",
    "interest": "Jardinería orgánica",
    "createdAt": "2024-10-15T08:00:00.000Z"
  },
  "current_orchards": [
    {
      "_id": "675e1111aaaa2222bbbb3333",
      "name": "Mi Primer Huerto",
      "surface": 50.0,
      "numPlants": 15,
      "createAt": "2024-11-01T10:00:00.000Z"
    }
  ],
  "recommended_orchards": [
    {
      "_id": "675b9876fedc5432ba109876",
      "name": "Huerto Orgánico Los Pinos",
      "surface": 150.5,
      "numPlants": 45,
      "numPlantTypes": 8,
      "avgPlantAge": 120.5,
      "owner_name": "María García",
      "similarity_score": 0.89
    }
  ],
  "chatbot_messages": {
    "fcm": "¡Juan! 🌱 Descubre 3 huertos perfectos para ti 🪴✨",
    "view": "¡Hola Juan! 🌿\n\nSoy Planty y tengo noticias emocionantes para ti 🎉\n\nVeo que ya tienes 1 huerto (Mi Primer Huerto). ¡Increíble! 🌱\n\nHe encontrado 3 huertos que te van a encantar:\n\n1. Huerto Orgánico Los Pinos (150.5m², 45 plantas)\n2. Jardín Vertical Urbano (80.0m², 32 plantas)\n3. Huerto Comunitario La Esperanza (200.0m², 60 plantas)\n\nEstos huertos han sido seleccionados especialmente para ti basándome en tu perfil y preferencias. ¡Hay mucho que aprender de ellos! 🌻\n\n¿Qué esperas? ¡Explora estas recomendaciones y lleva tu jardinería al siguiente nivel! 🚀🌿\n\nCon cariño verde,\nPlanty 🪴"
  },
  "cluster_id": 2,
  "generated_at": "2024-12-01T14:30:00.000Z"
}
```

---

## 4. Estado del Modelo

**Endpoint**: `GET /status`

Obtiene información sobre el modelo actualmente cargado.

### Request
```bash
curl -X GET http://localhost:3000/api/recommender/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "model_loaded": true,
  "model_file": "model_2024-12-01.pkl",
  "algorithm": "k-prototypes",
  "n_clusters": 4,
  "training_date": "2024-12-01",
  "n_users": 156
}
```

---

## 5. Listar Modelos Disponibles

**Endpoint**: `GET /models`

Lista todos los modelos entrenados disponibles en el sistema.

### Request
```bash
curl -X GET http://localhost:3000/api/recommender/models \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Response
```json
{
  "success": true,
  "models": [
    {
      "filename": "model_2024-12-01.pkl",
      "date": "2024-12-01",
      "size_mb": 2.45
    },
    {
      "filename": "model_2024-07-01.pkl",
      "date": "2024-07-01",
      "size_mb": 2.12
    },
    {
      "filename": "model_2024-01-01.pkl",
      "date": "2024-01-01",
      "size_mb": 1.89
    }
  ],
  "total": 3
}
```

---

## 6. Historial de Entrenamientos

**Endpoint**: `GET /training-history`

Obtiene el historial de entrenamientos realizados.

### Request
```bash
curl -X GET "http://localhost:3000/api/recommender/training-history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Parámetros
- `limit` (query, opcional): Número de registros (1-100, default: 10)

### Response
```json
{
  "success": true,
  "history": [
    {
      "training_date": "2024-12-01",
      "algorithm": "k-prototypes",
      "n_clusters": 4,
      "silhouette_score": 0.4523,
      "n_users_trained": 156,
      "trained_at": "2024-12-01T10:30:00.000Z"
    },
    {
      "training_date": "2024-07-01",
      "algorithm": "dbscan",
      "n_clusters": 5,
      "silhouette_score": 0.4201,
      "n_users_trained": 142,
      "trained_at": "2024-07-01T02:00:00.000Z"
    }
  ],
  "total": 2
}
```

---

## Modelos y Entrenamiento

### Pipeline de Features

El sistema extrae **14 features** por usuario:

#### Features Numéricas (12)
1. `total_orchards`: Total de huertos del usuario
2. `total_surface`: Superficie total (m²)
3. `avg_surface`: Superficie promedio por huerto
4. `total_plants`: Total de plantas
5. `avg_plants_per_orchard`: Promedio de plantas por huerto
6. `total_plant_types`: Total de tipos de plantas diferentes
7. `avg_plant_types`: Promedio de tipos por huerto
8. `max_plants`: Máximo de plantas en un huerto
9. `min_plants`: Mínimo de plantas en un huerto
10. `avg_plant_age`: Edad promedio de las plantas (días)
11. `orchards_last_30d`: Huertos creados en últimos 30 días
12. `account_age_days`: Edad de la cuenta (días)

#### Features Categóricas (2)
1. `country`: País del usuario
2. `interest`: Interés principal

### Proceso de Entrenamiento

1. **Obtención de datos**: Usuarios registrados en los últimos 6 meses
2. **Extracción de features**: Agregación y cálculo de características
3. **Normalización**: StandardScaler para features numéricas
4. **Clustering**: Entrenamiento con 3 algoritmos
5. **Selección**: Mejor modelo según Silhouette Score
6. **Persistencia**: Guardado con nombre `model_YYYY-MM-DD.pkl`
7. **Actualización BD**: Registro del entrenamiento en MongoDB

### Reentrenamiento Automático

El sistema se reentrena automáticamente:
- **1 de enero** a las 2:00 AM
- **1 de julio** a las 2:00 AM

Configurado con APScheduler en [scheduler_v2.py](api-recommender/app/services/scheduler_v2.py#L51-L63).

---

## Integración con Otros Servicios

### 1. API-Users
**Puerto**: 3001
**Endpoints usados**:
- `GET /api/by-registration-date?startDate=X&endDate=Y`: Obtener usuarios por rango de fechas

### 2. API-Orchard
**Puerto**: 3004
**Endpoints usados**:
- `POST /orchards/by-users`: Obtener huertos por lista de userIds

### 3. API-Chatbot
**Puerto**: 3003
**Endpoints usados**:
- `POST /chat/generate-recommendation-message`: Generar mensajes de Planty

---

## Variables de Entorno

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=3008
LOG_LEVEL=INFO

# MongoDB
MONGO_URI=mongodb://admin:password@localhost:27017/planty_recommender?authSource=admin
MONGO_DB_NAME=planty_recommender

# Microservices URLs
USERS_SERVICE_URL=http://localhost:3001/api
ORCHARD_SERVICE_URL=http://localhost:3004/orchards
CHATBOT_SERVICE_URL=http://localhost:3003/chat

# Model Storage
MODEL_STORAGE_PATH=./models
```

---

## Docker Deployment

### Usando Docker Compose

```bash
# Build y start
docker-compose up -d api-recommender

# Ver logs
docker-compose logs -f api-recommender

# Restart
docker-compose restart api-recommender
```

### Manualmente

```bash
# Build
cd api-recommender
docker build -t planty-recommender:latest .

# Run
docker run -d \
  --name planty-recommender \
  -p 3008:3008 \
  -e MONGO_URI=mongodb://admin:password@mongodb:27017/planty_recommender?authSource=admin \
  -e USERS_SERVICE_URL=http://api-users:3001/api \
  -e ORCHARD_SERVICE_URL=http://api-orchard:3004/orchards \
  -e CHATBOT_SERVICE_URL=http://api-chatbot:3003/chat \
  -v recommender-models:/app/models \
  planty-recommender:latest
```

---

## Ejemplos de Flujo Completo

### 1. Entrenar Modelo y Generar Recomendaciones

```bash
# Paso 1: Entrenar modelo
curl -X POST http://localhost:3000/api/recommender/train \
  -H "Authorization: Bearer YOUR_TOKEN"

# Paso 2: Verificar que el modelo se cargó
curl -X GET http://localhost:3000/api/recommender/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Paso 3: Generar recomendaciones para un usuario
curl -X POST "http://localhost:3000/api/recommender/recommend/675a1234abcd5678ef901234?limit=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Testing End-to-End

```bash
# Probar todo el flujo con un usuario
curl -X POST http://localhost:3000/api/recommender/test/675a1234abcd5678ef901234 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **400 Bad Request**: Parámetros inválidos
- **401 Unauthorized**: Token de autorización inválido o ausente
- **404 Not Found**: Recurso no encontrado (usuario, modelo, etc.)
- **500 Internal Server Error**: Error interno del servidor

---

## Soporte y Mantenimiento

- **Puerto**: 3008
- **Framework**: FastAPI + Python 3.11
- **Logs**: `/var/log/api-recommender` (en Docker)
- **Modelos**: Persistidos en volumen `recommender-models`

---

## 📚 Arquitectura de Archivos

```
api-recommender/
├── app/
│   ├── main.py                          # Aplicación FastAPI
│   ├── core/
│   │   └── config.py                    # Configuración
│   ├── api/
│   │   ├── routes_v2.py                 # Rutas API
│   │   ├── schemas_v2.py                # Pydantic schemas
│   │   └── deps.py                      # Dependencias
│   └── services/
│       ├── multi_clustering_service.py  # 3 algoritmos de clustering
│       ├── enhanced_feature_pipeline.py # Pipeline de features
│       ├── training_service_v2.py       # Servicio de entrenamiento
│       ├── recommendation_service_v2.py # Servicio de recomendaciones
│       ├── chatbot_client.py            # Cliente HTTP para chatbot
│       └── scheduler_v2.py              # Scheduler de reentrenamiento
├── models/                              # Modelos entrenados
├── requirements.txt                     # Dependencias Python
├── Dockerfile                           # Docker config
└── docker-compose.yml                   # Docker Compose
```

---

**Versión**: 2.0.0
**Última actualización**: 2024-12-11
