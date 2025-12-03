# 🌱 Sistema de Recomendaciones PlantGen - Explicación Completa

## 📌 ¿Qué hace el Servicio de Recomendaciones?

El **Recommender Service** es un microservicio inteligente que:

1. **Agrupa usuarios similares** usando Machine Learning (clustering)
2. **Genera recomendaciones personalizadas** de huertos para cada usuario
3. **Envía notificaciones automáticas** con las mejores recomendaciones
4. **Se actualiza automáticamente** cada mes con nuevos datos

---

## 🧠 ¿Cómo Funciona? (Explicación Simple)

### Paso 1: Clustering de Usuarios

Imagina que tienes 1000 usuarios. El sistema analiza:
- ¿Qué tipo de huertos tienen?
- ¿Cuánta experiencia tienen?
- ¿Qué objetivo tienen? (alimenticio, medicinal, ornamental)
- ¿Dónde viven?
- ¿Cuántas plantas manejan?

Luego **agrupa usuarios similares** en clusters (grupos). Por ejemplo:
- **Cluster 1**: Principiantes con huertos pequeños ornamentales
- **Cluster 2**: Expertos con huertos grandes de vegetales
- **Cluster 3**: Usuarios medicinales con experiencia media

### Paso 2: Recomendaciones

Cuando un usuario pide recomendaciones:
1. El sistema busca su cluster
2. Encuentra huertos de otros usuarios del **mismo cluster**
3. Calcula un "score" de compatibilidad
4. Retorna los mejores huertos recomendados

### Paso 3: Notificaciones Automáticas

- **Cada lunes**: Envía recomendaciones a todos los usuarios
- **Usuario nuevo**: Envía recomendaciones de bienvenida
- **Manual**: Un admin puede forzar recomendaciones para un cluster específico

---

## 🔐 ¿Por Qué Requiere Autenticación?

### Endpoints Públicos (NO requieren autenticación)

✅ **Cualquiera puede usar:**
```bash
# Ver estado del modelo
GET /status

# Ver información de clusters
GET /clusters

# Obtener recomendaciones para un usuario
GET /recommendations/user/{user_id}

# Webhook de usuario registrado
POST /webhook/user-registered
```

### Endpoints Protegidos (SÍ requieren autenticación)

🔒 **Solo admin puede usar:**
```bash
# Entrenar modelo (operación costosa)
POST /train

# Notificar cluster completo (envía notificaciones masivas)
POST /notify/cluster/{cluster_id}
```

### ¿Por Qué Esta Restricción?

**Razones de seguridad y performance:**

1. **`POST /train`**:
   - Entrena el modelo ML con TODOS los usuarios
   - Operación muy costosa (puede tardar minutos)
   - Consume muchos recursos del servidor
   - Si cualquiera pudiera ejecutarlo → podrían hacer DoS (Denial of Service)

2. **`POST /notify/cluster/{cluster_id}`**:
   - Envía notificaciones push a TODOS los usuarios de un cluster
   - Puede ser cientos o miles de notificaciones
   - Tiene costo (servicios de notificaciones push)
   - Si cualquiera pudiera ejecutarlo → spam masivo

**Ubicación del código de autenticación:**
- [deps.py:15-28](c:\Users\edgar\Desktop\Planty_Api_Gateway\recommender\app\api\deps.py#L15-L28)

```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Valida JWT (admin endpoints)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authentication")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│              USUARIO FLUTTER APP                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ GET /recommendations/user/{id}
                   ▼
┌─────────────────────────────────────────────────────────┐
│           RECOMMENDER SERVICE (Python)                  │
│                                                          │
│  1. Lee perfil del usuario de MongoDB                   │
│  2. Identifica su cluster_id                            │
│  3. Busca huertos de usuarios similares                 │
│  4. Calcula scores de compatibilidad                    │
│  5. Retorna top N recomendaciones                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Consultas a MongoDB
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    MONGODB                              │
│                                                          │
│  Collections:                                           │
│  • users (con cluster_id asignado)                      │
│  • orchards (huertos de usuarios)                       │
│  • training_history (historial de entrenamientos)       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 ¿Cómo Usar el Recommender desde Flutter?

### 1. Obtener Recomendaciones para un Usuario

**Endpoint:** `GET /recommendations/user/{user_id}?limit=10`

**NO requiere autenticación** ✅

**Ejemplo en Flutter:**

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<List<OrchardRecommendation>> getRecommendations(String userId) async {
  final url = Uri.parse('http://localhost:8000/recommendations/user/$userId?limit=10');

  final response = await http.get(url);

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final recommendations = data['recommendations'] as List;

    return recommendations.map((r) => OrchardRecommendation.fromJson(r)).toList();
  } else {
    throw Exception('Failed to load recommendations');
  }
}
```

**Respuesta del servidor:**

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
    },
    {
      "orchardId": "orchard-789",
      "name": "Jardín de Hierbas Aromáticas",
      "shortDescription": "5 plantas aromáticas, 2m², fácil cuidado",
      "estimatedWeeklyWater": 30.0,
      "maintenanceMinutes": 45,
      "fitness": 0.82,
      "score": 0.88
    }
  ],
  "generatedAt": "2024-01-15T10:35:00"
}
```

### 2. Ver Estado del Modelo

**Endpoint:** `GET /status`

**NO requiere autenticación** ✅

```dart
Future<ModelStatus> getModelStatus() async {
  final url = Uri.parse('http://localhost:8000/status');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    return ModelStatus.fromJson(jsonDecode(response.body));
  }
  throw Exception('Failed to load status');
}
```

**Respuesta:**
```json
{
  "model_exists": true,
  "trained_at": "2024-01-15T02:00:00",
  "n_clusters": 8,
  "metrics": {
    "silhouette_score": 0.42,
    "n_samples": 1543
  }
}
```

---

## 🔑 ¿Cómo Obtener un Token de Admin?

### Opción 1: Usar el Servicio de Autenticación

Si tu sistema tiene un servicio de autenticación:

```bash
# Login como admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plantgen.com","password":"admin123"}'
```

El token JWT viene en el header `Authorization: Bearer <token>`

### Opción 2: Generar Token Manualmente (Solo para Testing)

```python
from jose import jwt
from datetime import datetime, timedelta

# Payload del token
payload = {
    "sub": "admin",
    "email": "admin@plantgen.com",
    "role": "admin",
    "exp": datetime.utcnow() + timedelta(hours=24)
}

# Generar token (usa el mismo secret que tu .env)
SECRET_KEY = "tu-secret-key-aqui"
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

print(token)
```

### Opción 3: Usar el Script Incluido

```bash
cd recommender
python scripts/generate_admin_token.py
```

### Usar el Token

Una vez que tengas el token:

```bash
# Entrenar modelo
curl -X POST http://localhost:8000/train \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**En Flutter:**

```dart
Future<void> trainModel(String adminToken) async {
  final url = Uri.parse('http://localhost:8000/train');

  final response = await http.post(
    url,
    headers: {
      'Authorization': 'Bearer $adminToken',
      'Content-Type': 'application/json',
    },
  );

  if (response.statusCode == 200) {
    print('Model trained successfully');
  } else {
    throw Exception('Training failed: ${response.body}');
  }
}
```

---

## 📋 Qué Necesitas Saber para Usar el Recommender

### Para Desarrolladores Flutter (Frontend)

✅ **Necesitas saber:**
1. El `user_id` del usuario actual
2. Llamar al endpoint `GET /recommendations/user/{user_id}`
3. Parsear el JSON de respuesta
4. Mostrar las recomendaciones en la UI

❌ **NO necesitas:**
- Token de autenticación (para obtener recomendaciones)
- Entender cómo funciona el clustering
- Preocuparte por entrenar el modelo

### Para Administradores del Sistema

✅ **Necesitas saber:**
1. Cómo obtener un token JWT de admin
2. Cuándo entrenar el modelo:
   - Primera vez (inicialización)
   - Cada mes (se hace automático con el scheduler)
   - Después de agregar muchos usuarios nuevos
3. Cómo verificar que el modelo está funcionando (`GET /status`)

### Para DevOps

✅ **Necesitas configurar:**
1. Variables de entorno (MongoDB, JWT_SECRET, etc.)
2. El scheduler para entrenamientos automáticos
3. Integración con el servicio de notificaciones push
4. Monitoreo de logs y métricas

---

## 🎯 Features Que el Sistema Analiza

### Del Usuario:
- Nivel de experiencia (1, 2, 3)
- Cantidad de huertos que tiene
- Objetivo (alimenticio, medicinal, sostenible, ornamental)
- Ubicación geográfica
- Edad de la cuenta
- Si tiene notificaciones activadas

### De sus Huertos:
- Área total (m²)
- Agua semanal necesaria (litros)
- Minutos de mantenimiento
- Cantidad de plantas
- Diversidad de plantas
- Tiempo de vida promedio
- Racha de cuidado
- Tipos de plantas (vegetales, medicinales, ornamentales, aromáticas)

---

## 🔄 Flujo Completo de Uso

### 1. Inicialización (Solo una vez)

```bash
# 1. Verificar que MongoDB tiene usuarios
curl http://localhost:27017

# 2. Entrenar modelo inicial (necesita al menos 10 usuarios)
curl -X POST http://localhost:8000/train \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Respuesta:
# {
#   "success": true,
#   "n_clusters": 5,
#   "n_users_clustered": 100,
#   "silhouette_score": 0.38
# }
```

### 2. Uso Diario (Automático)

- **Lunes 9:00 AM**: El scheduler envía recomendaciones a todos los usuarios
- **Día 1 de mes, 2:00 AM**: El scheduler reentrena el modelo con nuevos datos

### 3. Usuario Nuevo se Registra

```bash
# El servicio de autenticación llama este webhook automáticamente
POST /webhook/user-registered
{
  "userId": "new-user-123"
}

# El recommender:
# 1. Asigna al usuario a un cluster
# 2. Genera recomendaciones iniciales
# 3. Envía notificación de bienvenida
```

### 4. Usuario Pide Recomendaciones en la App

```dart
// En tu app Flutter
final recommendations = await getRecommendations(currentUser.id);

// Mostrar en UI
ListView.builder(
  itemCount: recommendations.length,
  itemBuilder: (context, index) {
    final rec = recommendations[index];
    return OrchardRecommendationCard(
      name: rec.name,
      description: rec.shortDescription,
      waterNeeded: rec.estimatedWeeklyWater,
      maintenanceTime: rec.maintenanceMinutes,
      score: rec.score,
    );
  },
)
```

---

## ⚙️ Configuración Necesaria

### Variables de Entorno (.env)

```env
# MongoDB
MONGO_URI=mongodb://admin:password123@localhost:27017/plantgen
MONGO_DB_NAME=plantgen

# JWT (debe coincidir con el servicio de autenticación)
JWT_SECRET_KEY=tu-super-secret-key-aqui
JWT_ALGORITHM=HS256

# API
API_HOST=0.0.0.0
API_PORT=8000

# Logging
LOG_LEVEL=INFO

# Notificaciones (URL del servicio de notificaciones)
NOTIFICATIONS_SERVICE_URL=http://localhost:3006/api
```

---

## 🐛 Troubleshooting Común

### Error: "Model not trained"

**Causa:** El modelo nunca ha sido entrenado.

**Solución:**
```bash
curl -X POST http://localhost:8000/train \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### Error: "Not enough users for clustering (minimum: 10)"

**Causa:** Hay menos de 10 usuarios en la BD.

**Solución:** Crear más usuarios o usar el script de generación masiva de datos.

### Error: "User has no cluster_id assigned"

**Causa:** El usuario existe pero no tiene `cluster_id`.

**Solución:** Entrenar el modelo, que asignará clusters a todos los usuarios.

### Error: "Invalid token" / 401 Unauthorized

**Causa:** Token JWT inválido o expirado.

**Solución:**
1. Verificar que el `JWT_SECRET_KEY` en `.env` coincide con el del servicio de auth
2. Generar un nuevo token
3. Verificar que el token no ha expirado

### Recomendaciones vacías

**Causas posibles:**
1. El usuario está en un cluster sin otros usuarios
2. No hay huertos en la BD
3. Todos los huertos son del mismo usuario

**Solución:** Agregar más usuarios y huertos al sistema.

---

## 📈 Métricas de Calidad

### Silhouette Score
- **Rango:** -1 a 1
- **Interpretación:**
  - > 0.5: Clustering excelente
  - 0.25 - 0.5: Clustering razonable
  - < 0.25: Clustering débil

### Número de Clusters
- **Óptimo:** 5-10 clusters
- **Depende de:** Cantidad y diversidad de usuarios

---

## 🎉 Resumen Ejecutivo

### Para Desarrolladores Flutter:

**Lo que SÍ necesitas:**
```dart
// Llamar este endpoint (NO requiere auth)
GET /recommendations/user/{userId}?limit=10
```

**Lo que NO necesitas:**
- Autenticación de admin
- Entrenar el modelo
- Entender el algoritmo

### Para Admins:

**Lo que SÍ necesitas:**
```bash
# Token de admin para entrenar
POST /train (con Authorization header)

# Verificar estado
GET /status (sin auth)
```

**Lo que se hace automático:**
- Reentrenamiento mensual
- Recomendaciones semanales
- Procesamiento de usuarios nuevos

---

## 📞 Contacto y Soporte

Si tienes dudas:
1. Revisa los logs: `docker logs <container-id>`
2. Verifica el estado: `GET /status`
3. Consulta la documentación interactiva: `http://localhost:8000/docs`
