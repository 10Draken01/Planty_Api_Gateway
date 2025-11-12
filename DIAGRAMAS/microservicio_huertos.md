# Microservicio de Huertos (Orchards Service)

## Información General

- **Puerto:** 3004
- **Base de datos:** MongoDB (orchards_db)
- **Arquitectura:** Clean Architecture + DDD
- **Lenguaje:** TypeScript + Node.js + Express

## Propósito

Gestionar toda la información relacionada con los huertos de los usuarios, incluyendo:
- Creación, lectura, actualización y eliminación (CRUD) de huertos
- Gestión de plantas dentro de cada huerto
- Seguimiento del estado de las plantas
- Historial de eventos del huerto (siembra, cosecha, riego, etc.)
- Gestión de distribución espacial de plantas

---

## Modelo de Datos

### Entidad: Orchard (Huerto)

```typescript
interface Orchard {
  id: string;                    // UUID
  userId: string;                // Referencia al usuario propietario
  name: string;                  // Nombre del huerto
  description: string;           // Descripción
  dimensions: {
    width: number;               // Ancho en metros
    length: number;              // Largo en metros
    unit: 'meters' | 'feet';     // Unidad de medida
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  soilType: 'arcilloso' | 'arenoso' | 'limoso' | 'humífero';
  sunExposure: 'full' | 'partial' | 'shade';  // Exposición solar
  wateringSystem: 'manual' | 'drip' | 'sprinkler';
  plants: Plant[];               // Array de plantas en el huerto
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### Entidad: Plant (Planta)

```typescript
interface Plant {
  id: string;                    // UUID
  orchardId: string;             // Referencia al huerto
  name: string;                  // Nombre común
  scientificName?: string;       // Nombre científico
  species: string;               // Especie
  variety?: string;              // Variedad
  position: {
    x: number;                   // Posición X en el huerto (metros)
    y: number;                   // Posición Y en el huerto (metros)
    zone?: string;               // Zona del huerto (opcional)
  };
  plantedDate: Date;             // Fecha de siembra
  expectedHarvestDate?: Date;    // Fecha esperada de cosecha
  actualHarvestDate?: Date;      // Fecha real de cosecha
  status: 'planted' | 'growing' | 'flowering' | 'fruiting' | 'harvested' | 'dead';
  health: {
    status: 'healthy' | 'sick' | 'pest' | 'nutrient_deficiency';
    notes?: string;
    lastCheckDate: Date;
  };
  careSchedule: {
    watering: {
      frequency: number;         // Días entre riegos
      lastWatered?: Date;
      nextWatering?: Date;
    };
    fertilizing: {
      frequency: number;         // Días entre fertilizaciones
      lastFertilized?: Date;
      nextFertilizing?: Date;
    };
    pruning: {
      lastPruned?: Date;
      nextPruning?: Date;
    };
  };
  notes?: string;
  images?: string[];             // URLs de imágenes
  createdAt: Date;
  updatedAt: Date;
}
```

### Entidad: OrchardEvent (Evento del Huerto)

```typescript
interface OrchardEvent {
  id: string;
  orchardId: string;
  plantId?: string;              // Opcional si el evento es de una planta específica
  type: 'planting' | 'watering' | 'fertilizing' | 'pruning' | 'pest_control' |
        'harvest' | 'observation' | 'other';
  title: string;
  description: string;
  date: Date;
  userId: string;                // Usuario que registró el evento
  metadata?: {
    quantity?: number;           // Ej: cantidad de agua, fertilizante, cosecha
    unit?: string;
    images?: string[];
  };
  createdAt: Date;
}
```

---

## Casos de Uso (Use Cases)

### Gestión de Huertos

1. **CreateOrchardUseCase**
   - Input: userId, name, description, dimensions, location, soilType, etc.
   - Output: Orchard creado
   - Validaciones:
     - Usuario existe
     - Dimensiones válidas (>0)
     - Nombre único por usuario

2. **GetOrchardByIdUseCase**
   - Input: orchardId, userId
   - Output: Orchard con todas sus plantas
   - Validaciones:
     - Huerto existe
     - Usuario es propietario

3. **GetUserOrchardsUseCase**
   - Input: userId, filters (status, page, limit)
   - Output: Lista paginada de huertos
   - Permite filtrado y ordenamiento

4. **UpdateOrchardUseCase**
   - Input: orchardId, userId, updates
   - Output: Orchard actualizado
   - Validaciones:
     - Usuario es propietario
     - Datos válidos

5. **DeleteOrchardUseCase**
   - Input: orchardId, userId
   - Output: Success boolean
   - Validaciones:
     - Usuario es propietario
   - Acción: Marca como 'archived' (soft delete)

### Gestión de Plantas

6. **AddPlantToOrchardUseCase**
   - Input: orchardId, plant data
   - Output: Plant creada
   - Validaciones:
     - Huerto existe
     - Posición disponible
     - No colisiona con otras plantas

7. **GetPlantByIdUseCase**
   - Input: plantId
   - Output: Plant con detalles completos

8. **UpdatePlantUseCase**
   - Input: plantId, updates
   - Output: Plant actualizada
   - Permite actualizar posición, estado, salud, etc.

9. **RemovePlantFromOrchardUseCase**
   - Input: plantId, orchardId
   - Output: Success boolean

10. **GetPlantsByOrchardUseCase**
    - Input: orchardId, filters
    - Output: Lista de plantas del huerto

### Gestión de Eventos

11. **RecordOrchardEventUseCase**
    - Input: event data
    - Output: OrchardEvent creado

12. **GetOrchardEventsUseCase**
    - Input: orchardId, filters (type, dateRange)
    - Output: Lista de eventos

13. **GetPlantCareHistoryUseCase**
    - Input: plantId
    - Output: Historial de cuidados de la planta

---

## Endpoints REST

### Huertos

```http
POST   /api/orchards                      # Crear huerto
GET    /api/orchards                      # Listar huertos del usuario
GET    /api/orchards/:id                  # Obtener huerto por ID
PUT    /api/orchards/:id                  # Actualizar huerto
DELETE /api/orchards/:id                  # Eliminar (archivar) huerto
GET    /api/orchards/:id/plants           # Obtener plantas del huerto
GET    /api/orchards/:id/events           # Obtener eventos del huerto
GET    /api/orchards/:id/statistics       # Estadísticas del huerto
```

### Plantas

```http
POST   /api/orchards/:id/plants           # Agregar planta al huerto
GET    /api/plants/:id                    # Obtener planta por ID
PUT    /api/plants/:id                    # Actualizar planta
DELETE /api/plants/:id                    # Eliminar planta
GET    /api/plants/:id/care-schedule      # Obtener calendario de cuidados
PUT    /api/plants/:id/health             # Actualizar estado de salud
GET    /api/plants/:id/history            # Obtener historial de la planta
```

### Eventos

```http
POST   /api/orchards/:id/events           # Registrar evento
GET    /api/events/:id                    # Obtener evento por ID
PUT    /api/events/:id                    # Actualizar evento
DELETE /api/events/:id                    # Eliminar evento
```

---

## Estructura de Directorios

```
api-orchards/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Orchard.ts
│   │   │   ├── Plant.ts
│   │   │   └── OrchardEvent.ts
│   │   └── repositories/
│   │       ├── OrchardRepository.ts
│   │       ├── PlantRepository.ts
│   │       └── EventRepository.ts
│   ├── application/
│   │   ├── dtos/
│   │   │   ├── OrchardDTOs.ts
│   │   │   ├── PlantDTOs.ts
│   │   │   └── EventDTOs.ts
│   │   └── usecases/
│   │       ├── CreateOrchardUseCase.ts
│   │       ├── GetOrchardByIdUseCase.ts
│   │       ├── AddPlantToOrchardUseCase.ts
│   │       └── ... (otros use cases)
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   ├── OrchardModel.ts
│   │   │   │   ├── PlantModel.ts
│   │   │   │   └── EventModel.ts
│   │   │   └── mongoose-connection.ts
│   │   └── repositories/
│   │       ├── MongoOrchardRepository.ts
│   │       ├── MongoPlantRepository.ts
│   │       └── MongoEventRepository.ts
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── OrchardController.ts
│   │   │   ├── PlantController.ts
│   │   │   └── EventController.ts
│   │   ├── routes/
│   │   │   ├── orchard.routes.ts
│   │   │   ├── plant.routes.ts
│   │   │   └── event.routes.ts
│   │   └── middlewares/
│   │       ├── validateOwnership.ts
│   │       └── validateOrchardData.ts
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env
```

---

## Integración con Otros Servicios

### Con API-USERS:
- Validar que userId existe antes de crear huerto
- Actualizar campo `orchards_id` en el usuario
- Actualizar `count_orchards`

### Con API-GATEWAY:
- Todas las rutas pasan por el gateway
- Autenticación JWT requerida
- Rate limiting aplicado

### Con ALGORITMO GENÉTICO:
- Recibir diseños generados y crear plantas automáticamente
- Consultar huertos existentes para optimizar diseños

### Con NOTIFICACIONES:
- Notificar cuando es hora de regar
- Notificar cuando es hora de cosechar
- Alertas de plagas o enfermedades

---

## Diagrama de Arquitectura (Descripción)

```
┌─────────────────┐
│   API Gateway   │
│   (Puerto 3000) │
└────────┬────────┘
         │
         │ JWT Auth
         ▼
┌─────────────────────────┐
│  Orchards Service       │
│  (Puerto 3004)          │
│                         │
│  ┌──────────────────┐   │
│  │  Controllers     │   │
│  │  - Orchard       │   │
│  │  - Plant         │   │
│  │  - Event         │   │
│  └────────┬─────────┘   │
│           │             │
│  ┌────────▼─────────┐   │
│  │   Use Cases      │   │
│  │  - Create        │   │
│  │  - Read          │   │
│  │  - Update        │   │
│  │  - Delete        │   │
│  └────────┬─────────┘   │
│           │             │
│  ┌────────▼─────────┐   │
│  │  Repositories    │   │
│  │  - Mongo         │   │
│  └────────┬─────────┘   │
└───────────┼─────────────┘
            │
            ▼
   ┌─────────────────┐
   │    MongoDB      │
   │  orchards_db    │
   │                 │
   │  Collections:   │
   │  - orchards     │
   │  - plants       │
   │  - events       │
   └─────────────────┘
```

---

## Diagrama de Flujo: Crear Huerto

```
Usuario solicita crear huerto
         │
         ▼
API Gateway valida token JWT
         │
         ▼
Orchards Service recibe request
         │
         ▼
Validar datos de entrada
         │
         ├─ Error → Retornar 400
         │
         ▼
Verificar usuario existe (Users Service)
         │
         ├─ No existe → Retornar 404
         │
         ▼
Crear documento de huerto en MongoDB
         │
         ▼
Actualizar usuario con orchard_id
         │
         ▼
Retornar huerto creado (201)
         │
         ▼
Cliente recibe huerto
```

---

## Diagrama de Secuencia: Agregar Planta

```
Client              Gateway         OrchardsService       MongoDB
  │                    │                   │                 │
  │ POST /orchards/:id/plants             │                 │
  ├───────────────────>│                   │                 │
  │                    │ Validate JWT      │                 │
  │                    ├──────────────────>│                 │
  │                    │                   │ Get Orchard     │
  │                    │                   ├────────────────>│
  │                    │                   │<────────────────┤
  │                    │                   │ Validate owner  │
  │                    │                   │ Validate position│
  │                    │                   │ Create plant    │
  │                    │                   ├────────────────>│
  │                    │                   │<────────────────┤
  │                    │<──────────────────┤                 │
  │<───────────────────┤                   │                 │
  │ 201 Created        │                   │                 │
```

---

## Consideraciones de Seguridad

1. **Autenticación:**
   - Todas las rutas requieren JWT válido
   - Token validado por API Gateway

2. **Autorización:**
   - Usuario solo puede acceder a sus propios huertos
   - Middleware `validateOwnership` verifica propiedad

3. **Validación de Datos:**
   - Dimensiones deben ser > 0
   - Posiciones de plantas dentro de límites del huerto
   - No colisiones entre plantas

4. **Rate Limiting:**
   - Límite de huertos por usuario: 50
   - Límite de plantas por huerto: 500

---

## Variables de Entorno

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/orchards_db

# Servicio
PORT=3004
NODE_ENV=development

# Otros servicios
USERS_SERVICE_URL=http://localhost:3001
GENETIC_ALGORITHM_URL=http://localhost:3005

# Límites
MAX_ORCHARDS_PER_USER=50
MAX_PLANTS_PER_ORCHARD=500
```

---

## Dependencias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "uuid": "^9.0.0",
    "joi": "^17.11.0",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

---

## Comandos Docker

```bash
# Construir imagen
docker build -t api-orchards .

# Ejecutar contenedor
docker run -p 3004:3004 --env-file .env api-orchards

# Docker Compose
docker-compose up api-orchards
```

---

## Mejoras Futuras

1. Integración con sensores IoT para monitoreo en tiempo real
2. Análisis de imágenes con IA para detectar plagas
3. Recomendaciones automáticas de cuidados
4. Sistema de recordatorios personalizados
5. Compartir huertos con otros usuarios (colaboración)
6. Exportar datos en formatos estándar (CSV, PDF)
7. Gráficos y estadísticas avanzadas
