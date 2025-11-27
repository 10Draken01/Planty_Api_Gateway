# 🏛️ Arquitectura del Notifications Service

## 📐 Visión General

El Notifications Service está diseñado siguiendo los principios de **Clean Architecture**, asegurando alta cohesión, bajo acoplamiento y fácil mantenibilidad.

## 🎯 Principios Arquitectónicos

### 1. Clean Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ Controllers  │  │   Routes     │  │   Middleware    │    │
│  └──────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    Use Cases                         │    │
│  │  - SendNotificationToUserUseCase                     │    │
│  │  - SendNotificationToMultipleUsersUseCase           │    │
│  │  - BroadcastNotificationUseCase                     │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                      │
│  ┌──────────────────┐  ┌─────────────────────────────┐      │
│  │ FirebaseService  │  │  UsersServiceClient (HTTP)  │      │
│  └──────────────────┘  └─────────────────────────────┘      │
│  ┌──────────────────┐  ┌─────────────────────────────┐      │
│  │  LoggerService   │  │    Configuration            │      │
│  └──────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Dependency Inversion

Las capas externas dependen de las internas, nunca al revés:

- ✅ Controllers → Use Cases
- ✅ Use Cases → Services (interfaces)
- ✅ Services → External APIs

### 3. Single Responsibility

Cada componente tiene una única responsabilidad:

- **Controllers**: Manejan HTTP requests/responses
- **Use Cases**: Contienen lógica de negocio
- **Services**: Interactúan con servicios externos
- **Middleware**: Validación y transformación

---

## 🔄 Flujo de Datos

### Caso 1: Notificación a Un Usuario

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ POST /notify/user/:id
     ▼
┌────────────────────────┐
│ NotificationController │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────────────┐
│ SendNotificationToUserUseCase  │
└────────┬───────────────────────┘
         │
         ├──► UsersServiceClient.getUserById()
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │ Users Service│
         │    └─────────────┘
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │  MongoDB    │
         │    └─────────────┘
         │
         ├──► FirebaseService.sendToDevice()
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │ Firebase FCM│
         │    └─────────────┘
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │ Dispositivo │
         │    └─────────────┘
         │
         ▼
┌────────────────────────┐
│    Respuesta HTTP      │
└────────────────────────┘
```

### Caso 2: Broadcast

```
┌─────────┐
│ Cliente │
└────┬────┘
     │ POST /notify/broadcast
     ▼
┌────────────────────────┐
│ NotificationController │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────────────┐
│ BroadcastNotificationUseCase   │
└────────┬───────────────────────┘
         │
         ├──► UsersServiceClient.getAllUsersWithFCMToken()
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │ Users Service│
         │    └─────────────┘
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │  MongoDB    │
         │    │  (Query all │
         │    │  with FCM)  │
         │    └─────────────┘
         │         │
         │         ▼
         │    [user1, user2, ...]
         │
         ├──► FirebaseService.sendToMultipleDevices()
         │         │
         │         ▼
         │    ┌─────────────┐
         │    │ Firebase FCM│
         │    │ (Batch Send)│
         │    └─────────────┘
         │         │
         │         ▼
         │    ┌─────────────────────┐
         │    │ Múltiples Dispositivos│
         │    └─────────────────────┘
         │
         ▼
┌────────────────────────┐
│    Respuesta HTTP      │
│  - successCount        │
│  - failureCount        │
└────────────────────────┘
```

---

## 📦 Capas y Componentes

### Presentation Layer

**Responsabilidad**: Manejo de HTTP, validación de inputs, transformación de respuestas

**Componentes**:
- `NotificationController`: Endpoints REST
- `NotificationRoutes`: Definición de rutas
- `ValidationMiddleware`: Validación con Joi

### Application Layer

**Responsabilidad**: Lógica de negocio, orquestación

**Componentes**:
- `SendNotificationToUserUseCase`: Envío a 1 usuario
- `SendNotificationToMultipleUsersUseCase`: Envío batch
- `BroadcastNotificationUseCase`: Broadcast masivo
- `NotificationDTOs`: Data Transfer Objects

### Infrastructure Layer

**Responsabilidad**: Integración con servicios externos

**Componentes**:
- `FirebaseService`: SDK de Firebase Admin
- `UsersServiceClient`: Cliente HTTP para Users Service
- `LoggerService`: Winston logging
- `environment.ts`: Configuración

---

## 🔌 Integración con Servicios Externos

### Firebase Cloud Messaging

```typescript
FirebaseService
├── initialize()           // Inicializa Firebase Admin SDK
├── sendToDevice()         // Envía a 1 dispositivo
├── sendToMultipleDevices()// Envía a N dispositivos (batch)
├── sendToTopic()          // Envía a topic/canal
├── subscribeToTopic()     // Suscribe dispositivos a topic
└── validateToken()        // Valida token FCM
```

### Users Service (HTTP Client)

```typescript
UsersServiceClient
├── getUserById()              // GET /:id
├── getUsersByIds()            // Múltiples GET en paralelo
├── getAllUsersWithFCMToken()  // GET /with-fcm-token
└── healthCheck()              // GET /health
```

---

## 🛡️ Manejo de Errores

### Niveles de Error Handling

```
Controller
    │
    ├─► Validación de Input (400 Bad Request)
    │
    ▼
Use Case
    │
    ├─► Lógica de Negocio (404 Not Found, 409 Conflict)
    │
    ▼
Service
    │
    ├─► Integración Externa (503 Service Unavailable)
    │
    ▼
Global Error Handler (500 Internal Server Error)
```

### Estrategias

1. **Try-Catch en Controllers**: Captura errores de use cases
2. **Errores Específicos en Use Cases**: Throw con mensajes claros
3. **Axios Interceptors**: Logging de requests/responses HTTP
4. **Firebase Error Handling**: Retry logic para tokens inválidos
5. **Logging Centralizado**: Winston con niveles (error, warn, info)

---

## 📊 Escalabilidad

### Horizontal Scaling

El servicio es **stateless**, puede escalar horizontalmente:

```
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├──► Notifications Service (Instance 1)
       ├──► Notifications Service (Instance 2)
       └──► Notifications Service (Instance 3)
```

### Batch Processing

Para broadcasts masivos:

```typescript
// Firebase permite hasta 500 tokens por batch
const BATCH_SIZE = 500;

// El servicio divide automáticamente en batches
sendToMultipleDevices(tokens) {
  // Firebase SDK maneja batching internamente
}
```

---

## 🔐 Seguridad

### 1. Credenciales

- ✅ Firebase Service Account **nunca** en código
- ✅ Archivo `.gitignore` incluye `firebase-service-account.json`
- ✅ En producción: Variables de entorno o Secret Manager

### 2. Validación

- ✅ Joi schema validation en todos los endpoints
- ✅ Sanitización de inputs
- ✅ Validación de formato de tokens FCM

### 3. Comunicación

- ✅ HTTPS en producción (TLS)
- ✅ CORS configurado
- ✅ Rate limiting (recomendado agregar)

---

## 📈 Monitoreo

### Logs

```
logs/
├── error.log      // Solo errores
└── combined.log   // Todos los niveles
```

### Health Checks

```bash
GET /notify/health

# Docker Health Check (cada 30s)
curl http://localhost:3005/notify/health
```

### Métricas Recomendadas

- ✅ Notificaciones enviadas por minuto
- ✅ Tasa de éxito/fallo
- ✅ Tiempo de respuesta de Firebase
- ✅ Tiempo de respuesta de Users Service
- ✅ Tokens inválidos detectados

---

## 🧪 Testing Strategy

```
┌─────────────────────────────┐
│     Unit Tests              │
│  - Use Cases                │
│  - Services (mocked)        │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Integration Tests         │
│  - API Endpoints            │
│  - Firebase (mocked)        │
│  - Users Service (mocked)   │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│     E2E Tests               │
│  - Full flow con servicios  │
│    reales                   │
└─────────────────────────────┘
```

---

## 🚀 Deployment

### Docker

```bash
# Build
docker build -t api-notifications:latest .

# Run
docker run -p 3005:3005 \
  -e USERS_SERVICE_URL=http://users:3001 \
  -v $(pwd)/config:/app/config \
  api-notifications:latest
```

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes (Ejemplo)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notifications-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notifications
  template:
    metadata:
      labels:
        app: notifications
    spec:
      containers:
      - name: notifications
        image: api-notifications:latest
        ports:
        - containerPort: 3005
        env:
        - name: USERS_SERVICE_URL
          value: "http://users-service:3001"
        - name: FIREBASE_SERVICE_ACCOUNT_PATH
          value: "/secrets/firebase.json"
        volumeMounts:
        - name: firebase-credentials
          mountPath: /secrets
          readOnly: true
      volumes:
      - name: firebase-credentials
        secret:
          secretName: firebase-service-account
```

---

## 🎓 Decisiones de Diseño

### ¿Por qué Clean Architecture?

- ✅ Testeable: Cada capa puede testearse independientemente
- ✅ Mantenible: Cambios en infraestructura no afectan lógica
- ✅ Escalable: Fácil agregar nuevos casos de uso

### ¿Por qué HTTP en vez de gRPC?

- ✅ Simplicidad para este caso de uso
- ✅ Compatible con infraestructura existente
- ✅ Fácil debugging con herramientas estándar
- 🔄 Migración a gRPC es posible en el futuro

### ¿Por qué Stateless?

- ✅ Escalado horizontal sin sincronización
- ✅ No requiere base de datos propia
- ✅ Reinicio rápido
- ✅ Compatible con containers

### ¿Por qué Winston?

- ✅ Logging estructurado
- ✅ Múltiples transports (file, console)
- ✅ Niveles de log configurables
- ✅ Producción-ready

---

## 📝 Mejoras Futuras

1. **Rate Limiting**: Limitar requests por cliente
2. **Caching**: Cache de usuarios frecuentes
3. **Retry Logic**: Reintentos automáticos para fallos temporales
4. **Métricas**: Prometheus + Grafana
5. **Prioridades**: Queue system para notificaciones urgentes
6. **Templates**: Sistema de plantillas de notificaciones
7. **Scheduling**: Notificaciones programadas
8. **Analytics**: Dashboard de estadísticas
