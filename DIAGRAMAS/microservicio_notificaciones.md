# Microservicio de Notificaciones (Notifications Service)

## Información General

- **Puerto:** 3006
- **Base de datos:** MongoDB (notifications_db)
- **Arquitectura:** Clean Architecture + Event-Driven
- **Lenguaje:** TypeScript + Node.js + Express
- **Push Notifications:** Firebase Cloud Messaging (FCM)

## Propósito

Gestionar el sistema de notificaciones push y en-app para:
- Recordatorios de riego
- Alertas de cosecha
- Notificaciones de plagas/enfermedades
- Actualizaciones de diseños de huertos
- Consejos de cuidado personalizados

---

## Modelo de Datos

### Entidad: Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'watering' | 'harvest' | 'pest' | 'fertilizing' | 'pruning' |
        'weather' | 'design_ready' | 'tip' | 'general';
  title: string;
  body: string;
  data: {
    orchardId?: string;
    plantId?: string;
    designId?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  channels: ('push' | 'in-app' | 'email')[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Entidad: NotificationPreferences

```typescript
interface NotificationPreferences {
  userId: string;
  push: {
    enabled: boolean;
    watering: boolean;
    harvest: boolean;
    pest: boolean;
    fertilizing: boolean;
    weather: boolean;
    tips: boolean;
  };
  inApp: {
    enabled: boolean;
  };
  email: {
    enabled: boolean;
    weeklyDigest: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;           // "22:00"
    end: string;             // "08:00"
  };
  fcmToken?: string;
  updatedAt: Date;
}
```

### Entidad: NotificationTemplate

```typescript
interface NotificationTemplate {
  id: string;
  type: string;
  title: string;              // Soporta variables {{name}}
  body: string;
  data: Record<string, any>;
  defaultPriority: string;
  icon?: string;
  color?: string;
  sound?: string;
}
```

---

## Casos de Uso

1. **SendNotificationUseCase**
2. **ScheduleNotificationUseCase**
3. **GetUserNotificationsUseCase**
4. **MarkAsReadUseCase**
5. **UpdatePreferencesUseCase**
6. **SendBulkNotificationsUseCase**
7. **CancelScheduledNotificationUseCase**

---

## Endpoints REST

```http
POST   /api/notifications                      # Enviar notificación
POST   /api/notifications/schedule             # Programar notificación
GET    /api/notifications                      # Obtener notificaciones del usuario
PUT    /api/notifications/:id/read             # Marcar como leída
DELETE /api/notifications/:id                  # Eliminar notificación

GET    /api/notifications/preferences          # Obtener preferencias
PUT    /api/notifications/preferences          # Actualizar preferencias
POST   /api/notifications/register-device      # Registrar token FCM

POST   /api/notifications/bulk                 # Enviar notificaciones masivas (admin)
```

---

## Integración Firebase Cloud Messaging

### Configuración

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendPushNotification(
  token: string,
  notification: Notification
) {
  const message = {
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: notification.data,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  return await admin.messaging().send(message);
}
```

---

## Sistema de Tareas Programadas

### Cron Jobs (node-cron)

```typescript
// Verificar riego diario (8:00 AM)
cron.schedule('0 8 * * *', async () => {
  await checkWateringReminders();
});

// Verificar cosechas (diario 7:00 AM)
cron.schedule('0 7 * * *', async () => {
  await checkHarvestReminders();
});

// Limpieza de notificaciones expiradas (semanal)
cron.schedule('0 0 * * 0', async () => {
  await cleanupExpiredNotifications();
});
```

---

## Estructura de Directorios

```
api-notifications/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Notification.ts
│   │   │   ├── NotificationPreferences.ts
│   │   │   └── NotificationTemplate.ts
│   │   └── repositories/
│   │       └── NotificationRepository.ts
│   ├── application/
│   │   ├── dtos/
│   │   │   └── NotificationDTOs.ts
│   │   └── usecases/
│   │       ├── SendNotificationUseCase.ts
│   │       ├── ScheduleNotificationUseCase.ts
│   │       └── ... (otros)
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   ├── NotificationModel.ts
│   │   │   │   └── PreferencesModel.ts
│   │   │   └── mongoose-connection.ts
│   │   ├── repositories/
│   │   │   └── MongoNotificationRepository.ts
│   │   ├── messaging/
│   │   │   └── FirebaseMessaging.ts
│   │   └── cron/
│   │       └── NotificationScheduler.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── NotificationController.ts
│   │   └── routes/
│   │       └── notification.routes.ts
│   └── server.ts
├── firebase-service-account.json
├── package.json
└── .env
```

---

## Variables de Entorno

```bash
MONGODB_URI=mongodb://localhost:27017/notifications_db
PORT=3006
NODE_ENV=development

FIREBASE_PROJECT_ID=planty-app
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

ORCHARDS_SERVICE_URL=http://localhost:3004
USERS_SERVICE_URL=http://localhost:3001
```

---

## Dependencias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "firebase-admin": "^12.0.0",
    "node-cron": "^3.0.3",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  }
}
```

---

## Flujo de Notificación

```
Evento trigger (riego, cosecha, etc.)
         │
         ▼
Microservicio origen envía request
         │
         ▼
Notifications Service recibe
         │
         ▼
Verificar preferencias del usuario
         │
         ├─ Deshabilitado → Ignorar
         │
         ▼
Verificar quiet hours
         │
         ├─ En quiet hours → Programar para después
         │
         ▼
Obtener FCM token del usuario
         │
         ▼
Crear notificación en base de datos
         │
         ▼
Enviar push via Firebase
         │
         ├─ Éxito → Actualizar status='sent'
         ├─ Fallo → Actualizar status='failed', reintentar
         │
         ▼
Guardar en notificaciones in-app
         │
         ▼
Usuario ve notificación
```

---

## Mejoras Futuras

1. Soporte para email notifications
2. Notificaciones por SMS (Twilio)
3. Sistema de suscripciones por temas
4. Analytics de engagement
5. A/B testing de mensajes
6. Rich notifications con imágenes
7. Acciones directas desde notificación
