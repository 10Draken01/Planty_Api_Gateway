# Sistema de Recomendaciones con ML - Implementación Completa

## ✅ ARCHIVOS YA IMPLEMENTADOS

### API-USERS
- ✅ `GetUsersByDateRangeUseCase.ts` - Use case para obtener usuarios por fechas
- ✅ `UserRepository.ts` - Método `findByDateRange` agregado
- ✅ `MongoUserRepository.ts` - Implementación del método
- ✅ `UserController.ts` - Método `getUsersByDateRange` agregado
- ✅ `UserRoutes.ts` - Ruta `GET /by-registration-date` agregada
- ✅ `DependencyContainer.ts` - Inyección de dependencias completa

**Endpoint disponible:**
```
GET /api/users/by-registration-date?startDate=2024-01-01&endDate=2024-06-30
```

### API-ORCHARD
- ✅ `GetOrchardsByUserIdsUseCase.ts` - Use case para obtener huertos por userIds
- ✅ `OrchardRepository.ts` - Método `findByUserIds` agregado
- ✅ `MongoOrchardRepository.ts` - Implementación del método
- ✅ `OrchardController.ts` - Método `getByUserIds` agregado
- ✅ `OrchardRoutes.ts` - Ruta `POST /by-users` agregada
- ✅ `DependencyContainer.ts` - Inyección completa

**Endpoint disponible:**
```
POST /orchards/by-users
Body: { "userIds": ["id1", "id2", "id3"] }
```

### API-RECOMMENDER
- ✅ `multi_clustering_service.py` - 3 algoritmos (K-Prototypes, DBSCAN, GMM)
- ✅ `enhanced_feature_pipeline.py` - Pipeline de extracción de features
- ✅ `training_service_v2.py` - Servicio de entrenamiento completo
- ✅ `recommendation_service_v2.py` - Servicio de recomendaciones
- ✅ `chatbot_client.py` - Cliente HTTP para chatbot
- ✅ `scheduler_v2.py` - Reentrenamiento automático enero/julio
- ✅ `routes_v2.py` - Endpoints completos
- ✅ `schemas_v2.py` - Schemas Pydantic
- ✅ `config.py` - Configuración actualizada (puerto 3008)
- ✅ `main.py` - App actualizada

**Endpoints disponibles:**
```
POST   /train?training_date=YYYY-MM-DD (opcional)
POST   /recommend/{user_id}?limit=3
POST   /test/{user_id}
GET    /status
GET    /models
GET    /training-history
```

---

## 📝 ARCHIVOS PENDIENTES POR IMPLEMENTAR

### 1. API-CHATBOT - Endpoint de mensajes de recomendación

**Archivo:** `api-chatbot/src/application/use-cases/GenerateRecommendationMessageUseCase.ts`

```typescript
import { OllamaService } from '../../infrastructure/services/OllamaService';

export interface RecommendationMessageDTO {
  user: {
    id: string;
    name: string;
    experience_level: number;
    preferred_plant_category?: string[];
    count_orchards: number;
  };
  currentOrchards: Array<{
    name: string;
    area: number;
    countPlants: number;
  }>;
  recommendedOrchards: Array<{
    name: string;
    description: string;
    area: number;
    countPlants: number;
    score: number;
  }>;
}

export class GenerateRecommendationMessageUseCase {
  constructor(private ollamaService: OllamaService) {}

  async execute(dto: RecommendationMessageDTO): Promise<{
    fcm_message: string;
    view_message: string;
    generated_at: string;
  }> {
    const { user, currentOrchards, recommendedOrchards } = dto;

    // Prompt para Planty (personaje divertido y energético)
    const prompt = `Eres Planty, una plantita muy divertida, energética y amigable que ayuda a personas a cultivar huertos.

Usuario: ${user.name}
Nivel de experiencia: ${user.experience_level} (1=principiante, 2=intermedio, 3=experto)
Huertos actuales: ${user.count_orchards}
Preferencias: ${user.preferred_plant_category?.join(', ') || 'ninguna especificada'}

Huertos actuales de ${user.name}:
${currentOrchards.map((o, i) => `${i + 1}. ${o.name} - ${o.countPlants} plantas, ${o.area}m²`).join('\n')}

Nuevas recomendaciones:
${recommendedOrchards.map((o, i) => `${i + 1}. ${o.name} - ${o.description} (${o.countPlants} plantas, ${o.area}m², score: ${o.score})`).join('\n')}

Genera 2 mensajes:
1. FCM_MESSAGE: Mensaje corto (máximo 100 caracteres) para notificación push, muy divertido y llamativo
2. VIEW_MESSAGE: Mensaje largo (3-5 líneas) personalizado y motivador para mostrar en la app, con emojis y energía

Formato de respuesta EXACTO:
FCM_MESSAGE: [tu mensaje corto aquí]
VIEW_MESSAGE: [tu mensaje largo aquí]`;

    const response = await this.ollamaService.generateResponse(prompt);

    // Parsear respuesta
    const fcmMatch = response.match(/FCM_MESSAGE:\s*(.+)/);
    const viewMatch = response.match(/VIEW_MESSAGE:\s*(.+(?:\n.+)*)/);

    const fcmMessage = fcmMatch ? fcmMatch[1].trim().substring(0, 100) :
      `¡Hola ${user.name}! 🌱 ${recommendedOrchards.length} huertos nuevos para ti`;

    const viewMessage = viewMatch ? viewMatch[1].trim() :
      `¡Hola ${user.name}! 🌿\n\nPlanty ha encontrado ${recommendedOrchards.length} huertos perfectos para ti:\n${recommendedOrchards.map(o => `🌱 ${o.name}`).join('\n')}\n\n¡Sigue creciendo tu jardín! 🌺`;

    return {
      fcm_message: fcmMessage,
      view_message: viewMessage,
      generated_at: new Date().toISOString()
    };
  }
}
```

**Archivo:** `api-chatbot/src/presentation/controllers/ChatController.ts` (agregar método)

```typescript
async generateRecommendationMessage(req: Request, res: Response): Promise<void> {
  try {
    const { user, currentOrchards, recommendedOrchards } = req.body;

    if (!user || !recommendedOrchards) {
      res.status(400).json({
        success: false,
        error: 'Los campos user y recommendedOrchards son requeridos'
      });
      return;
    }

    const result = await this.generateRecommendationMessageUseCase.execute({
      user,
      currentOrchards: currentOrchards || [],
      recommendedOrchards
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando mensajes de recomendación'
    });
  }
}
```

**Archivo:** `api-chatbot/src/presentation/routes/ChatRoutes.ts` (agregar ruta)

```typescript
// POST /chat/generate-recommendation-message - Generar mensajes de recomendación
router.post('/generate-recommendation-message', (req, res) =>
  chatController.generateRecommendationMessage(req, res)
);
```

**Actualizar DependencyContainer** para inyectar el nuevo use case.

---

### 2. API-GATEWAY - Proxy para Recommender

**Archivo:** `api-gateway/src/services/proxy.ts` (agregar)

```typescript
/**
 * Proxy para el servicio de Recommender (ML)
 */
export const recommenderServiceProxy = createProxyMiddleware({
  target: process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: { '^/api/recommendations': '' },
  logLevel: 'debug',
  timeout: 60000, // 60 segundos para entrenamiento

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

**Archivo:** `api-gateway/src/app.ts` o donde se configuran las rutas (agregar)

```typescript
import { recommenderServiceProxy } from './services/proxy';

// ... otras rutas ...

// Recommender service (ML)
app.use('/api/recommendations', recommenderServiceProxy);
```

**Actualizar .env del api-gateway:**
```env
RECOMMENDER_SERVICE_URL=http://api-recommender:3008
```

---

### 3. DOCKER-COMPOSE - Agregar servicio recommender

**Archivo:** `docker-compose.yml` (agregar después de api-orchard)

```yaml
  # Recommender Service (ML)
  api-recommender:
    build:
      context: ./api-recommender
      dockerfile: Dockerfile
    container_name: planty-api-recommender
    restart: unless-stopped
    ports:
      - "3008:3008"
    environment:
      - PORT=3008
      - MONGO_URI=mongodb://${MONGO_ROOT_USER:-admin}:${MONGO_ROOT_PASSWORD:-password123}@mongodb:27017/users_db?authSource=admin
      - MONGO_DB_NAME=users_db
      - USERS_SERVICE_URL=http://api-users:3001
      - ORCHARDS_SERVICE_URL=http://api-orchard:3004
      - CHATBOT_SERVICE_URL=http://api-chatbot:3003
      - JWT_SECRET_KEY=${JWT_SECRET:-planty-super-secret-jwt-key-2024-change-in-production}
      - MIN_CLUSTERS=3
      - MAX_CLUSTERS=15
      - MODEL_STORAGE_PATH=/app/models
      - LOG_LEVEL=INFO
    depends_on:
      mongodb:
        condition: service_healthy
      api-users:
        condition: service_healthy
      api-orchard:
        condition: service_healthy
      api-chatbot:
        condition: service_healthy
    networks:
      - planty-network
    volumes:
      - recommender-models:/app/models
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:3008/')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

**Agregar volumen en la sección volumes:**
```yaml
volumes:
  mongodb-data:
    driver: local
  chromadb-data:
    driver: local
  chatbot-uploads:
    driver: local
  recommender-models:  # NUEVO
    driver: local
```

**Actualizar api-gateway depends_on:**
```yaml
  api-gateway:
    # ... configuración existente ...
    depends_on:
      api-users:
        condition: service_healthy
      authentication:
        condition: service_healthy
      api-chatbot:
        condition: service_healthy
      api-orchard:
        condition: service_healthy
      api-algorithm-gen:
        condition: service_healthy
      api-recommender:  # NUEVO
        condition: service_healthy
```

---

### 4. DOCKERFILE para api-recommender

**Archivo:** `api-recommender/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY app/ ./app/

# Crear directorio para modelos
RUN mkdir -p /app/models

# Exponer puerto
EXPOSE 3008

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3008", "--workers", "2"]
```

---

### 5. ACTUALIZAR requirements.txt

**Archivo:** `api-recommender/requirements.txt` (agregar scipy si no está)

```txt
# FastAPI y servidor
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Machine Learning
scikit-learn==1.4.0
kmodes==0.12.2
pandas==2.1.4
numpy==1.26.3
joblib==1.3.2
scipy==1.11.4  # AGREGAR SI NO ESTÁ

# MongoDB async
motor==3.3.2
pymongo==4.6.1

# Scheduler
APScheduler==3.10.4

# HTTP client
httpx==0.26.0
aiohttp==3.9.1

# Auth y seguridad
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0

# Utils
pydantic==2.5.3
pydantic-settings==2.1.0
```

---

## 🚀 CÓMO USAR EL SISTEMA

### 1. Iniciar todos los servicios

```bash
docker-compose up -d
```

### 2. Entrenar el modelo inicial

```bash
# Entrenar con datos de los últimos 6 meses
curl -X POST http://localhost:3000/api/recommendations/train

# O entrenar con fecha específica
curl -X POST "http://localhost:3000/api/recommendations/train?training_date=2024-07-01"
```

**Response:**
```json
{
  "success": true,
  "model_file": "model_2024-12-11.pkl",
  "algorithm": "kprototypes",
  "n_clusters": 8,
  "silhouette_score": 0.4523,
  "n_users_trained": 1543,
  "n_orchards": 3245,
  "training_date": "2024-12-11T10:30:00",
  "data_range": {
    "start_date": "2024-06-11T10:30:00",
    "end_date": "2024-12-11T10:30:00"
  }
}
```

### 3. Obtener recomendaciones para un usuario

```bash
curl -X POST "http://localhost:3000/api/recommendations/recommend/USER_ID?limit=3"
```

**Response:**
```json
{
  "success": true,
  "user_id": "user123",
  "cluster_id": 3,
  "recommendations": [
    {
      "orchard_id": "orchard456",
      "name": "Huerto Medicinal Compacto",
      "description": "3 plantas medicinales, bajo mantenimiento",
      "area": 12.5,
      "countPlants": 5,
      "score": 0.8734,
      "area_similarity": 0.92,
      "plants_similarity": 0.85,
      "popularity_score": 0.75
    },
    {
      "orchard_id": "orchard789",
      "name": "Huerto de Aromáticas",
      "description": "Hierbas aromáticas para cocina",
      "area": 10.0,
      "countPlants": 4,
      "score": 0.8245
    },
    {
      "orchard_id": "orchard101",
      "name": "Huerto Mixto Pequeño",
      "description": "Combinación de vegetales y aromáticas",
      "area": 15.0,
      "countPlants": 6,
      "score": 0.7932
    }
  ],
  "total_candidates": 45,
  "message": "3 huertos recomendados"
}
```

### 4. Probar con endpoint completo (incluye chatbot)

```bash
curl -X POST http://localhost:3000/api/recommendations/test/USER_ID
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "Juan Pérez",
    "experience_level": 2,
    "count_orchards": 2
  },
  "current_orchards": [
    {
      "name": "Mi primer huerto",
      "area": 10,
      "countPlants": 3
    }
  ],
  "recommended_orchards": [...],
  "chatbot_messages": {
    "fcm": "¡Hola Juan! 🌱 Planty tiene 3 huertos perfectos para ti. ¡Mira ahora!",
    "view": "¡Hola Juan! 🌿\n\nPlanty está súper emocionado de compartir contigo 3 huertos increíbles que combinan perfectamente con tu estilo:\n\n🌱 Huerto Medicinal Compacto\n🌱 Huerto de Aromáticas  \n🌱 Huerto Mixto Pequeño\n\n¡Con tu experiencia intermedia, estos huertos serán pan comido! 🎉\n\n¡Sigue haciendo crecer tu jardín! 🌺"
  },
  "cluster_id": 3,
  "generated_at": "2024-12-11T10:35:00"
}
```

### 5. Ver estado del modelo

```bash
curl http://localhost:3000/api/recommendations/status
```

### 6. Ver historial de entrenamientos

```bash
curl http://localhost:3000/api/recommendations/training-history
```

### 7. Listar modelos disponibles

```bash
curl http://localhost:3000/api/recommendations/models
```

---

## ⚙️ REENTRENAMIENTO AUTOMÁTICO

El sistema está configurado para reentrenarse automáticamente:
- **1 de enero** a las 2:00 AM
- **1 de julio** a las 2:00 AM

Esto se ejecuta automáticamente usando APScheduler. Ver logs:
```bash
docker logs planty-api-recommender -f
```

---

## 📊 CARACTERÍSTICAS DEL SISTEMA

### Algoritmos de Clustering
1. **K-Prototypes**: Maneja datos mixtos (numéricos + categóricos)
2. **DBSCAN**: Clustering basado en densidad
3. **Gaussian Mixture Model**: Enfoque probabilístico

El sistema selecciona automáticamente el mejor basado en Silhouette Score.

### Features Utilizadas
**Del Usuario:**
- experience_level
- count_orchards
- preferred_plant_category
- favorite_plants
- account_age_days
- has_profile_image
- is_verified

**De Orchards (agregados):**
- avg_orchard_area
- total_plants
- avg_plants_per_orchard
- avg_orchard_age_days

### Scoring de Recomendaciones
- **Area similarity** (30%): Similaridad en tamaño
- **Plants similarity** (40%): Similaridad en número de plantas
- **Popularity** (30%): Basado en cantidad de plantas

---

## 🔧 TROUBLESHOOTING

### Error: "No hay ningún modelo entrenado"
Ejecuta POST /train primero.

### Error: "Usuario no encontrado"
Verifica que el usuario exista en la BD.

### Recomendaciones vacías
- Verifica que haya otros usuarios en el cluster
- Verifica que esos usuarios tengan huertos

### Chatbot no genera mensajes
El sistema tiene fallback automático que genera mensajes genéricos si Ollama falla.

---

## 📁 ESTRUCTURA FINAL DE ARCHIVOS

```
Planty_Api_Gateway/
├── api-users/
│   ├── src/
│   │   ├── application/use-cases/
│   │   │   └── GetUsersByDateRangeUseCase.ts ✅
│   │   ├── domain/repositories/
│   │   │   └── UserRepository.ts ✅
│   │   ├── infrastructure/
│   │   │   └── repositories/MongoUserRepository.ts ✅
│   │   └── presentation/
│   │       ├── controllers/UserController.ts ✅
│   │       └── routes/UserRoutes.ts ✅
│
├── api-orchard/
│   ├── src/
│   │   ├── application/use-cases/
│   │   │   └── GetOrchardsByUserIdsUseCase.ts ✅
│   │   ├── domain/repositories/
│   │   │   └── OrchardRepository.ts ✅
│   │   ├── infrastructure/
│   │   │   └── repositories/MongoOrchardRepository.ts ✅
│   │   └── presentation/
│   │       ├── controllers/OrchardController.ts ✅
│   │       └── routes/OrchardRoutes.ts ✅
│
├── api-recommender/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_v2.py ✅
│   │   │   └── schemas_v2.py ✅
│   │   ├── core/
│   │   │   └── config.py ✅
│   │   ├── services/
│   │   │   ├── multi_clustering_service.py ✅
│   │   │   ├── enhanced_feature_pipeline.py ✅
│   │   │   ├── training_service_v2.py ✅
│   │   │   ├── recommendation_service_v2.py ✅
│   │   │   ├── chatbot_client.py ✅
│   │   │   └── scheduler_v2.py ✅
│   │   └── main.py ✅
│   ├── Dockerfile ⏳
│   └── requirements.txt ⏳
│
├── api-chatbot/
│   └── src/
│       ├── application/use-cases/
│       │   └── GenerateRecommendationMessageUseCase.ts ⏳
│       └── presentation/
│           ├── controllers/ChatController.ts ⏳
│           └── routes/ChatRoutes.ts ⏳
│
├── api-gateway/
│   └── src/
│       ├── services/proxy.ts ⏳
│       └── app.ts ⏳
│
└── docker-compose.yml ⏳
```

✅ = Completado
⏳ = Pendiente (código proporcionado arriba)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Implementar código pendiente del chatbot (copiar del apartado 1)
2. ✅ Agregar proxy en api-gateway (copiar del apartado 2)
3. ✅ Actualizar docker-compose.yml (copiar del apartado 3)
4. ✅ Crear Dockerfile (copiar del apartado 4)
5. ✅ Rebuild y restart servicios
6. ✅ Entrenar modelo inicial
7. ✅ Probar endpoints

---

**Sistema implementado por:** Claude Code
**Fecha:** 2024-12-11
**Versión:** 2.0.0
