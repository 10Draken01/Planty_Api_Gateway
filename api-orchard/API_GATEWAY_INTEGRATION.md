# 🔌 Integración con API Gateway - Completada

## ✅ Estado: INTEGRADO

El microservicio **api-orchard** ya está completamente integrado con el **API Gateway**.

---

## 📋 Cambios Realizados en API Gateway

### 1. Proxy Service ([api-gateway/src/services/proxy.ts](../api-gateway/src/services/proxy.ts:56-77))

Se agregó el proxy `orchardServiceProxy`:

```typescript
export const orchardServiceProxy = createProxyMiddleware({
  target: process.env.ORCHARD_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/orchards': '/orchards' },
  logLevel: 'debug',

  onProxyReq: (proxyReq, req) => {
    // Pasar información del usuario autenticado al microservicio (si existe)
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

### 2. Routes ([api-gateway/src/routes/index.ts](../api-gateway/src/routes/index.ts:24))

Se agregó la ruta en el router:

```typescript
// Sin autenticación (por defecto)
router.use('/orchards', orchardServiceProxy);

// Con autenticación (comentado, puedes habilitarlo)
// router.use('/orchards', validateTokenWithAuthService, orchardServiceProxy);
```

### 3. Variables de Entorno

Se actualizó [.env.example](../api-gateway/.env.example:58) y se creó [.env](../api-gateway/.env:63):

```env
ORCHARD_SERVICE_URL=http://localhost:3004
```

---

## 🌐 Endpoints Disponibles a través del Gateway

Todos los endpoints del microservicio están ahora disponibles a través del API Gateway con el prefijo `/api/orchards`:

### Gateway → Orchard Service

| Gateway Endpoint | Microservicio Endpoint | Método | Descripción |
|-----------------|------------------------|--------|-------------|
| `GET /api/orchards/health` | `GET /orchards/health` | GET | Health check |
| `POST /api/orchards` | `POST /orchards` | POST | Crear huerto |
| `GET /api/orchards` | `GET /orchards` | GET | Listar huertos |
| `GET /api/orchards?active=true` | `GET /orchards?active=true` | GET | Listar activos |
| `GET /api/orchards/:id` | `GET /orchards/:id` | GET | Obtener por ID |
| `PUT /api/orchards/:id` | `PUT /orchards/:id` | PUT | Actualizar |
| `DELETE /api/orchards/:id` | `DELETE /orchards/:id` | DELETE | Eliminar |
| `PATCH /api/orchards/:id/activate` | `PATCH /orchards/:id/activate` | PATCH | Activar |
| `PATCH /api/orchards/:id/deactivate` | `PATCH /orchards/:id/deactivate` | PATCH | Desactivar |
| `POST /api/orchards/:id/plants` | `POST /orchards/:id/plants` | POST | Agregar planta |
| `DELETE /api/orchards/:id/plants/:plantId` | `DELETE /orchards/:id/plants/:plantId` | DELETE | Remover planta |

---

## 🧪 Cómo Probar la Integración

### Opción 1: Desarrollo Local (Sin Docker)

#### Terminal 1: API Orchard
```bash
cd api-orchard
npm install
npm run dev
# Corre en puerto 3004
```

#### Terminal 2: API Gateway
```bash
cd api-gateway
npm install
npm run dev
# Corre en puerto 3000
```

#### Terminal 3: Probar
```bash
# A través del Gateway (puerto 3000)
curl http://localhost:3000/api/orchards/health

# Crear huerto a través del Gateway
curl -X POST http://localhost:3000/api/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto via Gateway",
    "description": "Creado a través del API Gateway",
    "width": 10,
    "height": 8
  }'

# Listar huertos a través del Gateway
curl http://localhost:3000/api/orchards
```

### Opción 2: Con Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# El API Gateway ya tiene configurado ORCHARD_SERVICE_URL=http://api-orchard:3004
```

#### Probar:
```bash
# A través del Gateway (puerto 3000)
curl http://localhost:3000/api/orchards/health

# Crear huerto
curl -X POST http://localhost:3000/api/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto Docker",
    "description": "Creado en Docker",
    "width": 15,
    "height": 12
  }'
```

---

## 🔐 Autenticación (Opcional)

Por defecto, las rutas de orchards **NO requieren autenticación**. Si quieres habilitarla:

### Editar [api-gateway/src/routes/index.ts](../api-gateway/src/routes/index.ts:24-25)

Cambia de:
```typescript
router.use('/orchards', orchardServiceProxy);
```

A:
```typescript
router.use('/orchards', validateTokenWithAuthService, orchardServiceProxy);
```

### Usar con Token JWT

```bash
# 1. Login para obtener token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.token')

# 2. Usar el token en las peticiones
curl http://localhost:3000/api/orchards \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Flujo de Peticiones

```
Cliente
   ↓
   GET http://localhost:3000/api/orchards
   ↓
API Gateway (puerto 3000)
   ├── Valida JWT (si está habilitado)
   ├── Rate Limiting
   ├── CORS
   └── Proxy → http://api-orchard:3004/orchards
       ↓
api-orchard (puerto 3004)
   ├── OrchardController
   ├── Use Cases
   ├── Repository
   └── MongoDB
       ↓
   Respuesta JSON
```

---

## 🐳 Variables de Entorno en Docker

El [docker-compose.yml](../docker-compose.yml:186) ya tiene configuradas las variables:

```yaml
api-gateway:
  environment:
    - ORCHARD_SERVICE_URL=http://api-orchard:3004
  depends_on:
    api-orchard:
      condition: service_healthy
```

---

## ✨ Ventajas de la Integración

1. **Punto de entrada único** - Todos los servicios a través del puerto 3000
2. **Autenticación centralizada** - JWT validado en el gateway
3. **Rate limiting** - Protección contra abuso
4. **CORS** - Configuración centralizada
5. **Logs** - Monitoreo centralizado
6. **Headers compartidos** - X-User-Id, X-User-Email

---

## 🎯 Ejemplos Completos

### Crear Huerto a través del Gateway

```bash
curl -X POST http://localhost:3000/api/orchards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto Principal",
    "description": "Huerto de plantas medicinales",
    "width": 20.5,
    "height": 15.0,
    "plants_id": []
  }'
```

### Listar Huertos Activos

```bash
curl http://localhost:3000/api/orchards?active=true | jq
```

### Agregar Planta a un Huerto

```bash
ORCHARD_ID="uuid-del-huerto"

curl -X POST http://localhost:3000/api/orchards/$ORCHARD_ID/plants \
  -H "Content-Type: application/json" \
  -d '{
    "plantId": "plant-uuid-123"
  }'
```

### Actualizar Huerto

```bash
curl -X PUT http://localhost:3000/api/orchards/$ORCHARD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Huerto Actualizado",
    "width": 25.0,
    "height": 18.0
  }'
```

---

## 📚 Documentación Relacionada

- [README del Microservicio](./README.md)
- [QUICK_START](./QUICK_START.md)
- [IMPLEMENTATION_SUMMARY](./IMPLEMENTATION_SUMMARY.md)

---

## ✅ Checklist de Verificación

- [x] Proxy agregado en `api-gateway/src/services/proxy.ts`
- [x] Ruta agregada en `api-gateway/src/routes/index.ts`
- [x] Variable de entorno `ORCHARD_SERVICE_URL` configurada
- [x] Docker Compose actualizado
- [x] API Gateway depende de api-orchard
- [x] Health checks configurados

---

## 🎉 Conclusión

La integración está **100% completa**. Ahora puedes acceder a todos los endpoints de api-orchard a través del API Gateway en:

**http://localhost:3000/api/orchards**

¡Todo listo para usar! 🚀
