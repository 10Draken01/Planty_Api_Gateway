# ⚡ Quick Start - Notifications Service

Guía rápida para poner en marcha el Notifications Service en 5 minutos.

## 📋 Pre-requisitos

- [ ] Node.js 18+ instalado
- [ ] Cuenta de Firebase creada
- [ ] Users Service corriendo en puerto 3001
- [ ] MongoDB corriendo (para Users Service)

---

## 🚀 Paso 1: Obtener Credenciales de Firebase

### 1.1 Ir a Firebase Console

```bash
https://console.firebase.google.com/
```

### 1.2 Seleccionar/Crear Proyecto

- Si no tienes proyecto: Click en "Add Project"
- Nombre sugerido: `mi-app-notificaciones`

### 1.3 Habilitar Cloud Messaging

1. En el proyecto, ir a **Build** > **Cloud Messaging**
2. Click en **Get Started** si aparece
3. Anotar el **Server Key** (opcional, para debug)

### 1.4 Descargar Service Account

1. Ir a **Project Settings** (⚙️ icono arriba a la izquierda)
2. Tab **Service Accounts**
3. Click **"Generate new private key"**
4. Guardar el archivo JSON descargado

---

## 🔧 Paso 2: Configurar el Servicio

### 2.1 Instalar dependencias

```bash
cd api-notifications
npm install
```

### 2.2 Copiar credenciales de Firebase

```bash
# Copiar el archivo descargado
cp ~/Downloads/your-firebase-key.json config/firebase-service-account.json
```

### 2.3 Crear archivo .env

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

---

## ▶️ Paso 3: Ejecutar el Servicio

### Opción A: Desarrollo (con hot reload)

```bash
npm run dev
```

### Opción B: Producción

```bash
npm run build
npm start
```

### Opción C: Docker

```bash
docker-compose up -d
```

---

## ✅ Paso 4: Verificar que Funciona

### 4.1 Health Check

```bash
curl http://localhost:3005/notify/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "service": "notifications-service",
  "status": "healthy",
  "timestamp": "..."
}
```

### 4.2 Verificar conexión con Users Service

Deberías ver en los logs:

```
[INFO]: Conexión con Users Service establecida
[INFO]: 🚀 Notifications Service corriendo en puerto 3005
```

Si ves:

```
[WARN]: ADVERTENCIA: Users Service no está disponible
```

Verifica que Users Service esté corriendo en `http://localhost:3001`

---

## 📱 Paso 5: Configurar Cliente Móvil

Antes de enviar notificaciones, el cliente móvil debe registrar su token FCM.

### 5.1 En tu app móvil (React Native / Flutter / etc)

Obtener el token FCM del dispositivo y enviarlo a Users Service:

```javascript
// Ejemplo en React Native con @react-native-firebase/messaging
import messaging from '@react-native-firebase/messaging';

async function registerFCMToken(userId) {
  const token = await messaging().getToken();

  await fetch(`http://localhost:3001/${userId}/fcm-token`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenFCM: token })
  });
}
```

### 5.2 Verificar que el token se guardó

```bash
curl http://localhost:3001/:userId
```

Debería retornar el usuario con `tokenFCM` incluido.

---

## 🎉 Paso 6: Enviar tu Primera Notificación

### 6.1 Enviar a un usuario

```bash
curl -X POST http://localhost:3005/notify/user/TU_USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hola desde Notifications Service!",
    "body": "Esta es tu primera notificación push"
  }'
```

### 6.2 Verificar resultado

**Si fue exitoso:**
```json
{
  "success": true,
  "message": "Notificación enviada exitosamente a Juan Pérez"
}
```

**Si falló:**
```json
{
  "success": false,
  "message": "El usuario no tiene un tokenFCM registrado"
}
```

---

## 🐛 Troubleshooting Rápido

### Error: "Firebase no ha sido inicializado"

**Solución:**
```bash
# Verificar que existe el archivo
ls -la config/firebase-service-account.json

# Si no existe, copiar de nuevo
cp ~/Downloads/your-key.json config/firebase-service-account.json
```

### Error: "Users Service no está disponible"

**Solución:**
```bash
# Verificar que Users Service está corriendo
curl http://localhost:3001/health

# Si no responde, iniciar Users Service
cd ../api-users
npm run dev
```

### Error: "El usuario no tiene tokenFCM"

**Solución:**
```bash
# Registrar manualmente un token de prueba
curl -X PATCH http://localhost:3001/TU_USER_ID/fcm-token \
  -H "Content-Type: application/json" \
  -d '{
    "tokenFCM": "eXYmPkjCT_WOkRqX2qHpgR:APA91bFz1..."
  }'
```

### Notificación no llega al dispositivo

**Checklist:**
- [ ] App tiene permisos de notificaciones
- [ ] Token FCM es actual (no expiró)
- [ ] Firebase Cloud Messaging está habilitado en el proyecto
- [ ] El dispositivo tiene conexión a Internet
- [ ] La app está en background (FCM no muestra notificaciones si la app está activa)

---

## 📚 Próximos Pasos

1. ✅ **Leer la documentación completa**: `README.md`
2. ✅ **Probar todos los endpoints**: `EXAMPLES.http`
3. ✅ **Entender la arquitectura**: `ARCHITECTURE.md`
4. ✅ **Configurar en producción**: Ver sección de Docker
5. ✅ **Integrar con API Gateway**: Agregar proxy

---

## 🔗 Enlaces Útiles

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Postman Collection](./EXAMPLES.http)
- [Documentación Completa](./README.md)

---

## 💬 ¿Necesitas Ayuda?

- **Logs del servicio**: `docker-compose logs -f notifications`
- **Logs de Firebase**: Ver en Firebase Console > Cloud Messaging
- **Test endpoints**: Usar `EXAMPLES.http` con Thunder Client o Postman

---

**¡Listo! 🎉 Tu Notifications Service está funcionando.**

Ahora puedes enviar notificaciones push a tus usuarios desde cualquier parte de tu aplicación.
