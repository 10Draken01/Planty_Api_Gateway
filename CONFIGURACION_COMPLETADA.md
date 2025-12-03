# ✅ Configuración del API Gateway Completada

## Cambios Realizados

### 1. ✅ Error de compilación Flutter corregido
**Archivo:** `Planty/lib/core/application/auth_provider.dart:103`

**Antes:**
```dart
await _userService.updateFCMToken(_currentUser!.user.id, fcmToken);
```

**Después:**
```dart
await _userService.updateFCMToken(_currentUser!.id, fcmToken);
```

**Razón:** `_currentUser` ya es de tipo `UserData`, no tiene propiedad `user`.

---

### 2. ✅ Archivo `.env` creado y configurado
**Archivo:** `Planty/.env`

```env
# API Gateway Configuration
API_URL=http://localhost:3000/api
ENCRYPTION_KEY=planty_encryption_key_32chars!
```

**Opciones según tu entorno:**

| Entorno | URL Correcta |
|---------|--------------|
| 🖥️ Emulador Android | `http://10.0.2.2:3000/api` |
| 📱 iOS Simulator | `http://localhost:3000/api` |
| 📱 Dispositivo físico | `http://TU_IP_LOCAL:3000/api` |
| 🌐 Producción | `https://tu-dominio.com/api` |

---

### 3. ✅ Archivo `.env.example` actualizado
**Archivo:** `Planty/.env.example`

Ahora incluye documentación completa sobre cómo configurar la URL según el entorno.

---

### 4. ✅ Documentación de arquitectura creada
**Archivo:** `Planty/ARQUITECTURA_API_GATEWAY.md`

Incluye:
- Diagrama de la arquitectura
- Explicación de todas las rutas
- Guía de troubleshooting
- Ejemplos de uso

---

## Arquitectura Actual

```
APP FLUTTER (Cliente)
       │
       │ http://localhost:3000/api
       ▼
API GATEWAY (Puerto 3000)
       │
       ├──► /api/auth/*          → Authentication (3002)
       ├──► /api/users/*         → Users (3001)
       ├──► /api/chat/message    → Chatbot (3003)
       ├──► /api/orchards/*      → Orchards (3004)
       └──► /api/algorithm-gen/* → Algorithm Gen (3005)
```

---

## Rutas Configuradas Correctamente en Flutter

Todos los servicios de Flutter ya están usando correctamente `API_URL`:

### ✅ Autenticación
```dart
// user_service.dart
final url = Uri.parse("$apiURL/auth/login");     // ✅
final url = Uri.parse('$apiURL/auth/register');  // ✅
```

### ✅ Usuarios
```dart
// user_service.dart
final url = Uri.parse('$apiURL/users/$userId');  // ✅
```

### ✅ Chatbot
```dart
// chatbot_remote_datasource.dart
final url = Uri.parse('$_apiUrl/chat/message');  // ✅
```

---

## Cómo Ejecutar

### 1. Levantar todos los microservicios

```bash
cd Planty_Api_Gateway
docker-compose up -d
```

Esto levanta:
- ✅ MongoDB (27017)
- ✅ ChromaDB (8000)
- ✅ API Gateway (3000)
- ✅ Users Service (3001)
- ✅ Authentication Service (3002)
- ✅ Chatbot Service (3003)
- ✅ Orchard Service (3004)
- ✅ Algorithm Gen Service (3005)

### 2. Verificar que el Gateway está corriendo

```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "service": "API Gateway",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

### 3. Ejecutar la app Flutter

```bash
cd Planty
flutter clean
flutter pub get
flutter run
```

---

## Verificar las URLs

### En desarrollo local (Windows/Mac/Linux)
```env
API_URL=http://localhost:3000/api
```

### En emulador Android
```env
API_URL=http://10.0.2.2:3000/api
```

**¿Por qué `10.0.2.2`?**
- El emulador Android no puede acceder a `localhost` directamente
- `10.0.2.2` es una IP especial que redirige al `localhost` del host

### En dispositivo físico Android/iOS

1. **Obtén la IP de tu computadora:**

   **Windows:**
   ```bash
   ipconfig
   ```
   Busca "Dirección IPv4" en tu adaptador WiFi (ejemplo: `192.168.1.100`)

   **Mac/Linux:**
   ```bash
   ifconfig | grep "inet "
   # o
   ip addr show
   ```

2. **Actualiza el `.env`:**
   ```env
   API_URL=http://192.168.1.100:3000/api
   ```

3. **Importante:** Tu dispositivo y tu computadora deben estar en la misma red WiFi.

---

## Troubleshooting

### ❌ Error: "Connection refused"

**Causa:** El API Gateway no está corriendo.

**Solución:**
```bash
docker-compose up -d api-gateway
docker logs planty-api-gateway
```

### ❌ Error: "Failed host lookup"

**Causa:** URL incorrecta en `.env`.

**Solución:** Verifica que estás usando la URL correcta según tu entorno (ver tabla arriba).

### ❌ Error: 401 Unauthorized

**Causa:** Token expirado o inválido.

**Solución:**
1. Cierra sesión en la app
2. Inicia sesión nuevamente

### ❌ Error: Gradle build failed

**Causa:** Errores de compilación.

**Solución:**
```bash
cd Planty
flutter clean
flutter pub get
flutter run
```

---

## Testing de las Rutas

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Test Chatbot (requiere token)
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"message":"Hola","sessionId":"123"}'
```

---

## Próximos Pasos

1. ✅ Error de compilación corregido
2. ✅ Configuración del `.env` completada
3. ✅ Arquitectura documentada
4. ⏭️ Ejecutar `flutter run` para probar
5. ⏭️ Verificar que el login funciona correctamente
6. ⏭️ Verificar que el chatbot funciona correctamente

---

## Resumen de Archivos Modificados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `Planty/lib/core/application/auth_provider.dart` | Modificado | Corregido error `_currentUser!.user.id` → `_currentUser!.id` |
| `Planty/.env` | Creado | Configuración del API Gateway |
| `Planty/.env.example` | Actualizado | Documentación de configuración |
| `Planty/ARQUITECTURA_API_GATEWAY.md` | Creado | Documentación completa de arquitectura |
| `CONFIGURACION_COMPLETADA.md` | Creado | Este archivo (resumen de cambios) |

---

## Notas Importantes

⚠️ **IMPORTANTE:**
- La app Flutter **SOLO** debe conectarse al API Gateway (puerto 3000)
- **NUNCA** conectarse directamente a los microservicios (3001, 3002, 3003, etc.)
- El Gateway maneja autenticación, CORS, y rate limiting
- Todas las rutas deben comenzar con `/api/`

✅ **Todo está listo para compilar y ejecutar la app Flutter.**

---

## Contacto y Soporte

Si tienes problemas:
1. Verifica que todos los servicios están corriendo: `docker ps`
2. Verifica los logs: `docker logs planty-api-gateway`
3. Verifica la configuración del `.env`
4. Revisa la documentación en `ARQUITECTURA_API_GATEWAY.md`
