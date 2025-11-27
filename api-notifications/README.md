# 🔔 Notifications Service - API de Notificaciones Push con Firebase FCM

Microservicio profesional para envío de notificaciones push utilizando **Firebase Cloud Messaging (FCM)**, diseñado con **Clean Architecture** e integración con el servicio de usuarios.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Ejemplos de Peticiones](#ejemplos-de-peticiones)
- [Docker](#docker)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## ✨ Características

- ✅ **Notificaciones Push** via Firebase Cloud Messaging
- ✅ **Envío a usuario individual** por ID
- ✅ **Envío a múltiples usuarios** (batch)
- ✅ **Broadcast** a todos los usuarios con tokenFCM
- ✅ **Integración con Users Service** via HTTP
- ✅ **Clean Architecture** (Domain, Application, Infrastructure, Presentation)
- ✅ **TypeScript** con tipos estrictos
- ✅ **Logging profesional** con Winston
- ✅ **Validación de datos** con Joi
- ✅ **Docker** y Docker Compose
- ✅ **Health checks** integrados
- ✅ **Manejo robusto de errores**

---

## 🏗️ Arquitectura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Notifications Service      │
│  (Puerto 3005)              │
│                             │
│  ┌──────────────────────┐   │
│  │ NotificationController│   │
│  └───────────┬──────────┘   │
│              │              │
│  ┌───────────▼──────────┐   │
│  │    Use Cases        │   │
│  │ - SendToUser        │   │
│  │ - SendToMultiple    │   │
│  │ - Broadcast         │   │
│  └───────────┬──────────┘   │
│              │              │
│  ┌───────────▼──────────┐   │
│  │  FirebaseService    │   │
│  └─────────────────────┘   │
└──────────┬──────────────────┘
           │
           │ HTTP
           ▼
┌─────────────────────────────┐
│    Users Service            │
│    (Puerto 3001)            │
│                             │
│  GET /:id                   │
│  GET /with-fcm-token        │
│  PATCH /:id/fcm-token       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│       MongoDB               │
│  (Usuarios + tokenFCM)      │
└─────────────────────────────┘
```

---

## 📦 Requisitos Previos

1. **Node.js** >= 18.x
2. **npm** o **yarn**
3. **Cuenta de Firebase** con Cloud Messaging habilitado
4. **Users Service** corriendo (puerto 3001)
5. **MongoDB** (para Users Service)

---

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
cd api-notifications
npm install
```

### 2. Configurar Firebase

#### Obtener credenciales de Firebase:

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** > **Service Accounts**
4. Click en **"Generate new private key"**
5. Descarga el archivo JSON

#### Guardar credenciales:

```bash
# Copiar el archivo descargado
cp ~/Downloads/your-firebase-credentials.json config/firebase-service-account.json
```

⚠️ **IMPORTANTE**: Nunca commitear `firebase-service-account.json` en Git (ya está en `.gitignore`)

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=3005
NODE_ENV=development
USERS_SERVICE_URL=http://localhost:3001
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
LOG_LEVEL=info
```

### 4. Ejecutar en modo desarrollo

```bash
npm run dev
```

El servicio estará disponible en `http://localhost:3005`

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3005` |
| `NODE_ENV` | Ambiente (`development`/`production`) | `development` |
| `USERS_SERVICE_URL` | URL del Users Service | `http://localhost:3001` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Ruta al archivo de credenciales Firebase | `./config/firebase-service-account.json` |
| `LOG_LEVEL` | Nivel de logs (`error`/`warn`/`info`/`debug`) | `info` |

---

## 📚 API Endpoints

### 1. Health Check

```http
GET /notify/health
```

**Respuesta:**
```json
{
  "success": true,
  "service": "notifications-service",
  "status": "healthy",
  "timestamp": "2025-11-24T18:00:00.000Z"
}
```

---

### 2. Enviar Notificación a un Usuario

```http
POST /notify/user/:id
```

**Parámetros:**
- `id` (path): ID del usuario

**Body:**
```json
{
  "title": "Título de la notificación",
  "body": "Cuerpo del mensaje",
  "data": {
    "customKey": "customValue"
  },
  "imageUrl": "https://example.com/image.png"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Notificación enviada exitosamente a Juan Pérez",
  "details": [
    {
      "userId": "123",
      "sent": true
    }
  ]
}
```

**Respuesta de Error:**
```json
{
  "success": false,
  "message": "El usuario no tiene un tokenFCM registrado"
}
```

---

### 3. Enviar Notificaciones a Múltiples Usuarios

```http
POST /notify/users
```

**Body:**
```json
{
  "userIds": ["user1", "user2", "user3"],
  "title": "Título de la notificación",
  "body": "Cuerpo del mensaje",
  "data": {
    "action": "open_screen",
    "screen": "home"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se enviaron 2 notificaciones de 3 intentos",
  "successCount": 2,
  "failureCount": 1,
  "details": [
    {
      "userId": "user1",
      "sent": true
    },
    {
      "userId": "user2",
      "sent": true
    },
    {
      "userId": "user3",
      "sent": false,
      "error": "Token inválido"
    }
  ]
}
```

---

### 4. Broadcast a Todos los Usuarios

```http
POST /notify/broadcast
```

**Body:**
```json
{
  "title": "Mantenimiento Programado",
  "body": "El sistema estará en mantenimiento mañana de 2-4 AM",
  "data": {
    "type": "maintenance",
    "priority": "high"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Broadcast enviado a 150 de 200 usuarios",
  "successCount": 150,
  "failureCount": 50
}
```

---

## 💡 Ejemplos de Peticiones

### Usando cURL

#### 1. Notificar a un usuario

```bash
curl -X POST http://localhost:3005/notify/user/123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nueva actualización",
    "body": "Hay una nueva versión disponible",
    "data": {
      "version": "2.0.0"
    }
  }'
```

#### 2. Notificar a múltiples usuarios

```bash
curl -X POST http://localhost:3005/notify/users \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2", "user3"],
    "title": "Recordatorio",
    "body": "No olvides revisar tus huertos"
  }'
```

#### 3. Broadcast

```bash
curl -X POST http://localhost:3005/notify/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Anuncio Importante",
    "body": "Nueva característica disponible en la app"
  }'
```

### Usando JavaScript/Axios

```javascript
import axios from 'axios';

const notificationsAPI = axios.create({
  baseURL: 'http://localhost:3005/notify',
  headers: { 'Content-Type': 'application/json' }
});

// Enviar a un usuario
await notificationsAPI.post('/user/123', {
  title: 'Hola!',
  body: 'Tienes un nuevo mensaje',
  data: { messageId: '456' }
});

// Enviar a múltiples usuarios
await notificationsAPI.post('/users', {
  userIds: ['user1', 'user2'],
  title: 'Alerta',
  body: 'Evento importante'
});

// Broadcast
await notificationsAPI.post('/broadcast', {
  title: 'Mantenimiento',
  body: 'Sistema en mantenimiento en 1 hora'
});
```

---

## 🐳 Docker

### Construir imagen

```bash
docker build -t api-notifications:latest .
```

### Ejecutar con Docker Compose

```bash
docker-compose up -d
```

### Ver logs

```bash
docker-compose logs -f notifications
```

### Detener

```bash
docker-compose down
```

---

## 📂 Estructura del Proyecto

```
api-notifications/
├── src/
│   ├── application/
│   │   ├── dtos/
│   │   │   └── NotificationDTOs.ts
│   │   └── use-cases/
│   │       ├── SendNotificationToUserUseCase.ts
│   │       ├── SendNotificationToMultipleUsersUseCase.ts
│   │       └── BroadcastNotificationUseCase.ts
│   ├── config/
│   │   └── environment.ts
│   ├── domain/
│   │   ├── entities/
│   │   └── interfaces/
│   ├── infrastructure/
│   │   ├── http/
│   │   │   └── UsersServiceClient.ts
│   │   └── services/
│   │       ├── FirebaseService.ts
│   │       └── LoggerService.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── NotificationController.ts
│   │   ├── middleware/
│   │   │   └── ValidationMiddleware.ts
│   │   └── routes/
│   │       └── NotificationRoutes.ts
│   └── app.ts
├── config/
│   ├── firebase-service-account.json (NO COMMITEAR)
│   └── firebase-service-account.example.json
├── logs/
├── .env
├── .env.example
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## 🔧 Troubleshooting

### Error: "Firebase no ha sido inicializado"

**Solución**: Verificar que existe el archivo `config/firebase-service-account.json` con credenciales válidas.

### Error: "Users Service no está disponible"

**Solución**: Verificar que el Users Service esté corriendo en el puerto configurado (default: 3001).

### Error: "El usuario no tiene tokenFCM"

**Solución**: El cliente móvil debe actualizar primero su token FCM:

```bash
curl -X PATCH http://localhost:3001/:id/fcm-token \
  -H "Content-Type: application/json" \
  -d '{"tokenFCM": "token-del-dispositivo"}'
```

### Notificación no llega al dispositivo

**Verificar**:
1. Token FCM es válido y actualizado
2. App tiene permisos de notificaciones
3. Firebase Cloud Messaging está habilitado en el proyecto
4. Revisar logs del servicio: `docker-compose logs -f notifications`

---

## 📝 Integración con Users Service

### Endpoints Requeridos en Users Service

El Notifications Service requiere que el Users Service tenga estos endpoints:

#### 1. Obtener usuario por ID
```http
GET /:id
```

#### 2. Actualizar token FCM
```http
PATCH /:id/fcm-token
Body: { "tokenFCM": "..." }
```

#### 3. Obtener usuarios con FCM token (opcional)
```http
GET /with-fcm-token
```

---

## 🔐 Seguridad

- ✅ No expone credenciales de Firebase
- ✅ Validación de inputs con Joi
- ✅ Logs no contienen información sensible
- ✅ Health checks sin exponer detalles internos
- ✅ Manejo seguro de errores

---

## 📄 Licencia

MIT

---

## 👨‍💻 Autor

Desarrollado como parte del sistema de microservicios ApiGateway

---

## 🤝 Contribuciones

Pull requests son bienvenidos. Para cambios mayores, por favor abre un issue primero.

---

## 📞 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en el repositorio.
