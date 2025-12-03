# 🚀 Guía Rápida - Setup Flutter con API Gateway

## ✅ Problema Solucionado

Se corrigió el error de compilación en Flutter:
```
Error: The getter 'user' isn't defined for the type 'UserData'
```

**Ubicación:** `Planty/lib/core/application/auth_provider.dart:103`

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `Planty/.env` | **Configuración principal** - Define la URL del API Gateway |
| `Planty/.env.example` | Plantilla con ejemplos de configuración |
| `Planty/ARQUITECTURA_API_GATEWAY.md` | **Documentación completa** de la arquitectura |
| `CONFIGURACION_COMPLETADA.md` | Resumen de todos los cambios realizados |
| `test-gateway.ps1` | Script para verificar el Gateway (Windows) |
| `test-gateway.sh` | Script para verificar el Gateway (Linux/Mac) |

## 🎯 Inicio Rápido

### 1️⃣ Configurar el API Gateway

```bash
# En la carpeta raíz del proyecto
cd Planty_Api_Gateway

# Levantar todos los servicios
docker-compose up -d

# Verificar que todo esté funcionando
.\test-gateway.ps1    # Windows
./test-gateway.sh     # Linux/Mac
```

### 2️⃣ Configurar Flutter

```bash
# Ir a la carpeta de Flutter
cd Planty

# Verificar/Editar el archivo .env
# Para emulador Android:
echo "API_URL=http://10.0.2.2:3000/api" > .env

# Para desarrollo local:
echo "API_URL=http://localhost:3000/api" > .env

# Instalar dependencias
flutter pub get

# Ejecutar la app
flutter run
```

### 3️⃣ Configuración según tu entorno

#### 🖥️ Emulador Android
```env
API_URL=http://10.0.2.2:3000/api
```

#### 📱 iOS Simulator
```env
API_URL=http://localhost:3000/api
```

#### 📱 Dispositivo Físico (misma red WiFi)
```env
# Obtén tu IP local:
# Windows: ipconfig
# Mac/Linux: ifconfig

API_URL=http://192.168.1.XXX:3000/api
```

## 🔍 Verificación Rápida

### Paso 1: Verificar Docker
```bash
docker ps
```

Debes ver estos contenedores corriendo:
- `planty-api-gateway` (puerto 3000)
- `planty-authentication` (puerto 3002)
- `planty-api-users` (puerto 3001)
- `planty-api-chatbot` (puerto 3003)
- `planty-api-orchard` (puerto 3004)
- `planty-mongodb` (puerto 27017)

### Paso 2: Verificar API Gateway
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

### Paso 3: Test Login
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

## 🏗️ Arquitectura

```
Flutter App
    ↓ http://localhost:3000/api
API Gateway (3000)
    ↓
    ├─→ /auth/*          → Authentication (3002)
    ├─→ /users/*         → Users (3001)
    ├─→ /chat/message    → Chatbot (3003)
    ├─→ /orchards/*      → Orchards (3004)
    └─→ /algorithm-gen/* → Algorithm Gen (3005)
```

## 📝 Rutas Disponibles

### Autenticación (público)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse

### Usuarios (requiere token)
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario

### Chatbot (requiere token)
- `POST /api/chat/message` - Enviar mensaje

### Huertos (requiere token)
- `GET /api/orchards` - Listar huertos
- `POST /api/orchards` - Crear huerto
- `GET /api/orchards/:id` - Obtener huerto
- `PUT /api/orchards/:id` - Actualizar huerto
- `DELETE /api/orchards/:id` - Eliminar huerto

## 🐛 Troubleshooting

### ❌ Error: "Connection refused"

**Solución:**
```bash
# Verificar que el Gateway esté corriendo
docker logs planty-api-gateway

# Reiniciar el Gateway
docker-compose restart api-gateway
```

### ❌ Error: "Failed host lookup"

**Causa:** URL incorrecta en `.env`

**Solución:** Verifica la configuración según tu entorno (ver sección 3️⃣)

### ❌ Error: Gradle build failed

**Solución:**
```bash
cd Planty
flutter clean
flutter pub get
flutter run
```

### ❌ Error: 401 Unauthorized

**Causa:** Token expirado

**Solución:**
1. Cierra sesión en la app
2. Vuelve a iniciar sesión

## 📚 Documentación Completa

Para más detalles, revisa:
- **Arquitectura completa:** `Planty/ARQUITECTURA_API_GATEWAY.md`
- **Resumen de cambios:** `CONFIGURACION_COMPLETADA.md`

## ⚡ Comandos Útiles

### Docker
```bash
# Ver logs del Gateway
docker logs -f planty-api-gateway

# Reiniciar todos los servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Ver estado de contenedores
docker ps
```

### Flutter
```bash
# Limpiar proyecto
flutter clean

# Obtener dependencias
flutter pub get

# Analizar código
flutter analyze

# Ejecutar en modo debug
flutter run

# Ejecutar en modo release
flutter run --release

# Ver dispositivos disponibles
flutter devices
```

## 🎉 ¡Listo!

Tu aplicación Flutter ahora está configurada correctamente para comunicarse con el API Gateway.

**Recuerda:**
- ✅ Siempre usa el API Gateway (puerto 3000)
- ❌ Nunca te conectes directamente a los microservicios
- 📝 Verifica el `.env` según tu entorno
- 🔒 El Gateway maneja la autenticación automáticamente

---

**¿Problemas?** Revisa `Planty/ARQUITECTURA_API_GATEWAY.md` para documentación detallada.
