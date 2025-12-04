# API Plants - Microservicio de Gestión de Plantas

Microservicio para la gestión del catálogo de plantas disponibles en el sistema Planty.

## 🏗️ Arquitectura

Este microservicio sigue **Clean Architecture (Hexagonal Architecture)** con las siguientes capas:

```
api-plants/
├── src/
│   ├── domain/              # Lógica de negocio
│   │   ├── entities/        # Entidades de dominio
│   │   └── repositories/    # Interfaces de repositorios
│   ├── application/         # Casos de uso
│   │   ├── use-cases/       # Casos de uso específicos
│   │   └── dtos/            # Data Transfer Objects
│   ├── infrastructure/      # Implementaciones técnicas
│   │   ├── database/        # Conexión a BD
│   │   ├── repositories/    # Implementación de repositorios
│   │   └── container/       # Inyección de dependencias
│   ├── presentation/        # Capa de presentación
│   │   ├── controllers/     # Controladores HTTP
│   │   └── routes/          # Definición de rutas
│   └── config/              # Configuración
└── package.json
```

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar variables de entorno según sea necesario
```

## 🔧 Configuración

Edita el archivo `.env` con tus configuraciones:

```env
PORT=3005
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/planty_plants
MONGO_DB_NAME=planty_plants
```

## 📦 Scripts

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Tests
npm test
npm run test:watch
```

## 📡 Endpoints

### Health Check
```
GET /health
GET /plants/health
```

### Plantas
```
GET /plants - Obtener todas las plantas
```

### Respuesta de ejemplo:
```json
{
  "success": true,
  "data": {
    "plants": [
      {
        "_id": 1,
        "species": "Cilantro",
        "scientificName": "Coriandrum sativum",
        "type": ["aromatic", "medicinal", "vegetable"],
        "sunRequirement": "medium",
        "weeklyWatering": 11,
        "harvestDays": 38,
        "soilType": "Suelo fértil, bien drenado, pH 6.0-7.0",
        "waterPerKg": 250,
        "benefits": ["Alto en vitaminas A, C, K", "Antioxidantes"],
        "size": 0.15
      }
    ],
    "total": 1
  }
}
```

## 🛠️ Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing
- **express-rate-limit** - Rate limiting

## 🏃 Ejecutar

```bash
# Asegúrate de que MongoDB esté corriendo
# Luego ejecuta:
npm run dev
```

El servidor estará disponible en `http://localhost:3005`

## 📝 Licencia

MIT
