# API Orchard - Microservicio de Gestión de Huertos

Microservicio para la gestión completa de huertos (orchards) en el sistema Planty.

## 🌱 Características

- **CRUD Completo** de huertos
- **Gestión de plantas** dentro de cada huerto
- **Activación/Desactivación** de huertos
- **Arquitectura limpia** (Clean Architecture + DDD)
- **Base de datos** MongoDB
- **Rate limiting** para seguridad
- **Docker** ready

## 📋 Modelo de Datos

```typescript
{
  "_id": "UUID",
  "name": "String",
  "description": "String",
  "plants_id": "List<Plant_id>",
  "width": "Double",
  "height": "Double",
  "state": "Bool",
  "createAt": "Date",
  "updateAt": "Date",
  "timeOfLife": "Int",
  "streakOfDays": "Int",
  "countPlants": "Int"
}
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 20+
- MongoDB
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Configurar variables de entorno en .env
```

### Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Build
npm run build

# Producción
npm start
```

### Docker

```bash
# Construir imagen
docker build -t api-orchard .

# Ejecutar contenedor
docker run -p 3004:3004 --env-file .env api-orchard
```

## 📚 Endpoints

### Health & Info

- `GET /health` - Health check general
- `GET /info` - Información del sistema
- `GET /orchards/health` - Health check del servicio

### CRUD de Huertos

- `POST /orchards` - Crear huerto
- `GET /orchards` - Listar todos los huertos
- `GET /orchards?active=true` - Listar huertos activos
- `GET /orchards?active=false` - Listar huertos inactivos
- `GET /orchards/:id` - Obtener huerto por ID
- `PUT /orchards/:id` - Actualizar huerto
- `DELETE /orchards/:id` - Eliminar huerto

### Gestión de Estado

- `PATCH /orchards/:id/activate` - Activar huerto
- `PATCH /orchards/:id/deactivate` - Desactivar huerto

### Gestión de Plantas

- `POST /orchards/:id/plants` - Agregar planta al huerto
- `DELETE /orchards/:id/plants/:plantId` - Remover planta del huerto

## 📝 Ejemplos de Uso

### Crear Huerto

```bash
POST /orchards
Content-Type: application/json

{
  "name": "Huerto Principal",
  "description": "Huerto de plantas medicinales",
  "width": 10.5,
  "height": 8.3,
  "plants_id": [],
  "state": true
}
```

### Actualizar Huerto

```bash
PUT /orchards/:id
Content-Type: application/json

{
  "name": "Huerto Principal Renovado",
  "description": "Huerto actualizado",
  "width": 12.0,
  "height": 9.0
}
```

### Agregar Planta

```bash
POST /orchards/:id/plants
Content-Type: application/json

{
  "plantId": "plant-uuid-123"
}
```

## 🏗️ Arquitectura

El proyecto sigue **Clean Architecture** y **Domain-Driven Design (DDD)**:

```
src/
├── domain/              # Entidades y lógica de negocio
│   ├── entities/
│   └── repositories/
├── application/         # Casos de uso
│   ├── use-cases/
│   └── dtos/
├── infrastructure/      # Implementaciones técnicas
│   ├── container/
│   ├── database/
│   └── repositories/
├── presentation/        # Controladores y rutas
│   ├── controllers/
│   └── routes/
└── config/             # Configuración
```

## 🔒 Variables de Entorno

```env
PORT=3004
NODE_ENV=development
CORS_ORIGIN=*
MONGO_URI=mongodb://localhost:27017/planty_orchards
MONGO_DB_NAME=planty_orchards
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-secret-key
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 📦 Estructura de Respuestas

### Éxito

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

## 🤝 Integración con otros servicios

Este microservicio se integra con:

- **api-gateway** (puerto 3000) - Enrutamiento centralizado
- **api-users** (puerto 3001) - Gestión de usuarios
- **authentication** (puerto 3002) - Autenticación JWT

## 📄 Licencia

MIT
