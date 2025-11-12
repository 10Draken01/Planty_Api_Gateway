# Microservicio de Algoritmo Genético (Genetic Algorithm Service)

## Información General

- **Puerto:** 3005
- **Base de datos:** MongoDB (genetic_designs_db) + Redis (cache)
- **Arquitectura:** Clean Architecture + Algoritmos Genéticos
- **Lenguaje:** TypeScript + Node.js + Express
- **Procesamiento:** CPU-intensive, soporte para workers paralelos

## Propósito

Generar diseños óptimos de distribución de plantas en huertos utilizando algoritmos genéticos que consideran:
- Compatibilidad entre plantas (alelopatía)
- Requisitos de espacio y luz solar
- Acceso para mantenimiento
- Rotación de cultivos
- Maximización de producción
- Optimización de recursos (agua, nutrientes)

---

## Modelo de Datos

### Entidad: GardenDesign (Diseño de Huerto)

```typescript
interface GardenDesign {
  id: string;                    // UUID
  userId: string;                // Usuario que solicitó el diseño
  orchardId?: string;            // Huerto objetivo (opcional si es nuevo)
  name: string;                  // Nombre del diseño
  description?: string;
  parameters: DesignParameters;  // Parámetros de entrada
  result: DesignResult;          // Resultado del algoritmo
  fitness: number;               // Valor de fitness (0-100)
  generation: number;            // Generación en la que se generó
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingTime: number;        // Tiempo de procesamiento en ms
  appliedToOrchard: boolean;     // Si se aplicó al huerto
  createdAt: Date;
  updatedAt: Date;
}

interface DesignParameters {
  dimensions: {
    width: number;               // Ancho del huerto (metros)
    length: number;              // Largo del huerto (metros)
  };
  plants: PlantRequest[];        // Plantas que se desean incluir
  soilType: 'arcilloso' | 'arenoso' | 'limoso' | 'humífero';
  sunExposure: 'full' | 'partial' | 'shade';
  wateringSystem: 'manual' | 'drip' | 'sprinkler';
  objectives: {
    maximizeYield: number;       // Peso 0-1
    optimizeSpace: number;       // Peso 0-1
    minimizeWater: number;       // Peso 0-1
    easyMaintenance: number;     // Peso 0-1
  };
  constraints: {
    pathWidth: number;           // Ancho mínimo de caminos (metros)
    minPlantSpacing: number;     // Espaciado mínimo entre plantas
    avoidIncompatible: boolean;  // Evitar plantas incompatibles
    rotationPlan: boolean;       // Considerar rotación de cultivos
  };
  geneticParams: {
    populationSize: number;      // Tamaño de población (default: 100)
    generations: number;         // Número de generaciones (default: 50)
    mutationRate: number;        // Tasa de mutación (default: 0.1)
    crossoverRate: number;       // Tasa de cruzamiento (default: 0.8)
  };
}

interface PlantRequest {
  species: string;
  scientificName?: string;
  quantity: number;              // Cantidad deseada
  priority: 'high' | 'medium' | 'low';  // Prioridad de inclusión
}

interface DesignResult {
  plants: PlacedPlant[];         // Plantas con sus posiciones
  zones: Zone[];                 // Zonas del huerto
  paths: Path[];                 // Caminos de acceso
  metrics: DesignMetrics;
  recommendations: string[];     // Recomendaciones adicionales
}

interface PlacedPlant {
  id: string;
  species: string;
  scientificName?: string;
  position: { x: number; y: number; };
  rotation: number;              // Ángulo de rotación (para plantas no circulares)
  radius: number;                // Radio de la planta (metros)
  companions: string[];          // IDs de plantas compañeras cercanas
  incompatibilities: string[];   // IDs de plantas incompatibles cercanas (para warnings)
  expectedYield: number;         // Producción estimada (kg/año)
  careNeeds: {
    wateringFrequency: number;   // Días entre riegos
    sunHours: number;            // Horas de sol necesarias
    fertilizingFrequency: number;
  };
}

interface Zone {
  id: string;
  name: string;
  type: 'planting' | 'path' | 'compost' | 'tool_storage';
  polygon: Point[];              // Polígono que define la zona
  plants?: string[];             // IDs de plantas en la zona
}

interface Path {
  id: string;
  width: number;
  points: Point[];               // Puntos del camino
  accessTo: string[];            // IDs de zonas a las que da acceso
}

interface Point {
  x: number;
  y: number;
}

interface DesignMetrics {
  totalPlants: number;
  usedArea: number;              // m²
  unusedArea: number;            // m²
  efficiency: number;            // Porcentaje de uso del espacio (0-100)
  compatibilityScore: number;    // Puntuación de compatibilidad (0-100)
  estimatedYield: number;        // Producción total estimada (kg/año)
  waterUsage: number;            // Uso de agua estimado (L/día)
  maintenanceScore: number;      // Facilidad de mantenimiento (0-100)
  biodiversityScore: number;     // Diversidad de especies (0-100)
}
```

### Entidad: PlantCompatibility (Compatibilidad de Plantas)

```typescript
interface PlantCompatibility {
  id: string;
  plant1: string;                // Especie 1
  plant2: string;                // Especie 2
  compatibility: number;         // -1 (incompatible) a 1 (muy compatible)
  reason: string;                // Razón de la compatibilidad/incompatibilidad
  distance: {
    min: number;                 // Distancia mínima recomendada (metros)
    max: number;                 // Distancia máxima efectiva (metros)
  };
  benefits?: string[];           // Beneficios de plantarlas juntas
  risks?: string[];              // Riesgos de plantarlas juntas
  references?: string[];         // Referencias bibliográficas
}
```

### Entidad: PlantData (Datos de Plantas)

```typescript
interface PlantData {
  id: string;
  species: string;
  scientificName: string;
  commonNames: string[];
  family: string;                // Familia botánica
  type: 'vegetable' | 'fruit' | 'herb' | 'flower';
  growthHabit: 'vine' | 'bush' | 'tree' | 'ground_cover';
  size: {
    height: { min: number; max: number; };        // cm
    width: { min: number; max: number; };         // cm
    rootDepth: { min: number; max: number; };     // cm
  };
  spacing: {
    betweenPlants: number;       // Distancia mínima entre plantas (cm)
    betweenRows: number;         // Distancia mínima entre hileras (cm)
  };
  requirements: {
    sunlight: 'full' | 'partial' | 'shade';
    waterNeeds: 'low' | 'medium' | 'high';
    soilType: string[];
    soilPH: { min: number; max: number; };
    temperature: { min: number; max: number; };   // °C
  };
  lifecycle: {
    daysToGermination: number;
    daysToMaturity: number;
    harvestWindow: number;       // Días de ventana de cosecha
    perennial: boolean;
  };
  yield: {
    averagePerPlant: number;     // kg por planta
    season: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
  };
  companions: string[];          // Especies compatibles
  antagonists: string[];         // Especies incompatibles
  nutrients: {
    nRequired: 'low' | 'medium' | 'high';  // Nitrógeno
    pRequired: 'low' | 'medium' | 'high';  // Fósforo
    kRequired: 'low' | 'medium' | 'high';  // Potasio
  };
}
```

---

## Algoritmo Genético

### Componentes del Algoritmo

1. **Cromosoma (Chromosome):**
   - Representa un diseño completo del huerto
   - Estructura: Array de PlacedPlant

2. **Población (Population):**
   - Conjunto de cromosomas (diseños)
   - Tamaño configurable (default: 100)

3. **Función de Fitness:**
   - Evalúa la calidad de un diseño
   - Considera múltiples objetivos ponderados

4. **Operadores Genéticos:**
   - **Selección:** Ruleta o torneo
   - **Cruzamiento:** Intercambio de segmentos entre cromosomas
   - **Mutación:** Pequeños cambios aleatorios en posiciones

### Función de Fitness (Pseudo-código)

```typescript
function calculateFitness(design: PlacedPlant[], params: DesignParameters): number {
  let fitness = 0;

  // 1. Maximizar rendimiento
  const yieldScore = calculateTotalYield(design);
  fitness += yieldScore * params.objectives.maximizeYield;

  // 2. Optimizar espacio
  const spaceScore = calculateSpaceEfficiency(design, params.dimensions);
  fitness += spaceScore * params.objectives.optimizeSpace;

  // 3. Minimizar uso de agua
  const waterScore = 100 - calculateWaterUsage(design);
  fitness += waterScore * params.objectives.minimizeWater;

  // 4. Facilitar mantenimiento
  const maintenanceScore = calculateMaintenanceEase(design);
  fitness += maintenanceScore * params.objectives.easyMaintenance;

  // 5. Penalizaciones
  fitness -= calculateCollisionPenalty(design);           // Plantas superpuestas
  fitness -= calculateIncompatibilityPenalty(design);    // Plantas incompatibles cercanas
  fitness -= calculateBoundaryPenalty(design, params.dimensions);  // Fuera de límites

  // 6. Bonificaciones
  fitness += calculateCompanionBonus(design);             // Plantas compañeras
  fitness += calculateBiodiversityBonus(design);          // Diversidad de especies

  return Math.max(0, Math.min(100, fitness));
}
```

### Flujo del Algoritmo

```
1. Inicialización:
   - Generar población inicial aleatoria
   - Evaluar fitness de cada individuo

2. Bucle de evolución (repetir por N generaciones):
   a. Selección:
      - Seleccionar parejas de padres basándose en fitness

   b. Cruzamiento:
      - Con probabilidad P_c, cruzar padres para generar hijos
      - Heredar características de ambos padres

   c. Mutación:
      - Con probabilidad P_m, mutar algunos genes
      - Cambiar posiciones, rotar plantas, etc.

   d. Evaluación:
      - Calcular fitness de nuevos individuos

   e. Reemplazo:
      - Mantener mejores individuos (elitismo)
      - Reemplazar peores con nueva generación

   f. Criterio de parada:
      - Si fitness > umbral O generación >= max, DETENER
      - Sino, continuar

3. Retornar mejor diseño encontrado
```

---

## Casos de Uso (Use Cases)

1. **GenerateDesignUseCase**
   - Input: userId, DesignParameters
   - Output: GardenDesign (con status='processing')
   - Proceso asíncrono: Ejecuta algoritmo genético en background
   - Notifica cuando completa

2. **GetDesignByIdUseCase**
   - Input: designId, userId
   - Output: GardenDesign con resultados

3. **GetUserDesignsUseCase**
   - Input: userId, filters
   - Output: Lista paginada de diseños

4. **ApplyDesignToOrchardUseCase**
   - Input: designId, orchardId
   - Output: Success boolean
   - Acción: Crea plantas en el huerto basándose en el diseño

5. **GetPlantCompatibilityUseCase**
   - Input: plant1, plant2
   - Output: PlantCompatibility data

6. **GetPlantDataUseCase**
   - Input: species
   - Output: PlantData completa

7. **CompareDesignsUseCase**
   - Input: designIds[]
   - Output: Comparación de métricas

8. **OptimizeExistingOrchardUseCase**
   - Input: orchardId
   - Output: Diseño mejorado basado en huerto existente

---

## Endpoints REST

```http
POST   /api/genetic/designs                    # Generar nuevo diseño
GET    /api/genetic/designs                    # Listar diseños del usuario
GET    /api/genetic/designs/:id                # Obtener diseño por ID
DELETE /api/genetic/designs/:id                # Eliminar diseño
POST   /api/genetic/designs/:id/apply          # Aplicar diseño a huerto
GET    /api/genetic/designs/:id/status         # Consultar estado de procesamiento
POST   /api/genetic/designs/compare            # Comparar múltiples diseños

GET    /api/genetic/compatibility              # Obtener compatibilidad entre plantas
GET    /api/genetic/plants                     # Listar plantas disponibles
GET    /api/genetic/plants/:species            # Obtener datos de planta

POST   /api/genetic/optimize/:orchardId        # Optimizar huerto existente
```

---

## Estructura de Directorios

```
api-genetic/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── GardenDesign.ts
│   │   │   ├── PlantCompatibility.ts
│   │   │   └── PlantData.ts
│   │   ├── repositories/
│   │   │   ├── DesignRepository.ts
│   │   │   └── PlantDataRepository.ts
│   │   └── algorithms/
│   │       ├── GeneticAlgorithm.ts
│   │       ├── Fitness.ts
│   │       ├── Chromosome.ts
│   │       ├── Population.ts
│   │       └── GeneticOperators.ts
│   ├── application/
│   │   ├── dtos/
│   │   │   └── GeneticDTOs.ts
│   │   └── usecases/
│   │       ├── GenerateDesignUseCase.ts
│   │       ├── GetDesignByIdUseCase.ts
│   │       ├── ApplyDesignToOrchardUseCase.ts
│   │       └── ... (otros use cases)
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── models/
│   │   │   │   ├── DesignModel.ts
│   │   │   │   ├── PlantDataModel.ts
│   │   │   │   └── CompatibilityModel.ts
│   │   │   └── mongoose-connection.ts
│   │   ├── repositories/
│   │   │   ├── MongoDesignRepository.ts
│   │   │   └── MongoPlantDataRepository.ts
│   │   ├── cache/
│   │   │   └── RedisCache.ts
│   │   └── queue/
│   │       └── BullQueue.ts              # Para procesamiento asíncrono
│   ├── presentation/
│   │   ├── controllers/
│   │   │   ├── DesignController.ts
│   │   │   └── PlantDataController.ts
│   │   ├── routes/
│   │   │   ├── design.routes.ts
│   │   │   └── plantdata.routes.ts
│   │   └── middlewares/
│   │       └── validateDesignParams.ts
│   ├── workers/
│   │   └── geneticWorker.ts              # Worker para procesamiento en background
│   └── server.ts
├── package.json
├── tsconfig.json
└── .env
```

---

## Integración con Otros Servicios

### Con ORCHARDS SERVICE:
- Consultar huertos existentes
- Aplicar diseños generados (crear plantas)
- Obtener datos de plantas actuales para optimización

### Con API-GATEWAY:
- Todas las rutas pasan por el gateway
- Autenticación JWT requerida
- Endpoints con procesamiento largo retornan 202 Accepted

### Con NOTIFICACIONES:
- Notificar cuando diseño está listo
- Enviar alertas de procesamiento

### Con CHATBOT:
- Chatbot puede recomendar generación de diseño
- Explicar métricas del diseño generado

---

## Diagrama de Arquitectura

```
┌─────────────────┐
│   API Gateway   │
│   (Puerto 3000) │
└────────┬────────┘
         │
         │ JWT Auth
         ▼
┌────────────────────────────────┐
│  Genetic Algorithm Service     │
│  (Puerto 3005)                 │
│                                │
│  ┌──────────────────────┐      │
│  │  REST Controllers    │      │
│  │  - Design            │      │
│  │  - PlantData         │      │
│  └──────────┬───────────┘      │
│             │                  │
│  ┌──────────▼───────────┐      │
│  │   Use Cases          │      │
│  │  - Generate          │      │
│  │  - Apply             │      │
│  └──────────┬───────────┘      │
│             │                  │
│  ┌──────────▼───────────┐      │
│  │  Genetic Algorithm   │      │
│  │  - Population        │      │
│  │  - Fitness           │      │
│  │  - Operators         │      │
│  └──────────┬───────────┘      │
│             │                  │
│  ┌──────────▼───────────┐      │
│  │   Bull Queue         │◄─────┼──── Worker Processes
│  │   (Background Jobs)  │      │     (Parallel Execution)
│  └──────────┬───────────┘      │
│             │                  │
│  ┌──────────▼───────────┐      │
│  │  Repositories        │      │
│  │  - MongoDB           │      │
│  │  - Redis Cache       │      │
│  └──────────┬───────────┘      │
└─────────────┼──────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │   MongoDB           │
    │   genetic_designs_db│
    │                     │
    │   Collections:      │
    │   - designs         │
    │   - plant_data      │
    │   - compatibility   │
    └─────────────────────┘
              │
              │
    ┌─────────▼───────────┐
    │   Redis             │
    │   (Cache + Queue)   │
    └─────────────────────┘
```

---

## Diagrama de Flujo: Generar Diseño

```
Usuario solicita generar diseño
         │
         ▼
API Gateway valida token JWT
         │
         ▼
Genetic Service recibe request
         │
         ▼
Validar parámetros de entrada
         │
         ├─ Error → Retornar 400
         │
         ▼
Crear registro de diseño (status='pending')
         │
         ▼
Encolar trabajo en Bull Queue
         │
         ▼
Retornar 202 Accepted con designId
         │
         ▼
Cliente recibe designId
         │
         │
    [Background Worker]
         │
         ▼
Worker toma trabajo de la cola
         │
         ▼
Actualizar status a 'processing'
         │
         ▼
Inicializar población aleatoria
         │
         ▼
Bucle de evolución (50 generaciones)
    │
    ├─ Selección de padres
    ├─ Cruzamiento
    ├─ Mutación
    ├─ Evaluación de fitness
    └─ Reemplazo generacional
         │
         ▼
Seleccionar mejor individuo
         │
         ▼
Calcular métricas finales
         │
         ▼
Guardar resultado en MongoDB
         │
         ▼
Actualizar status a 'completed'
         │
         ▼
Notificar al usuario (Notifications Service)
         │
         ▼
Usuario consulta diseño completado
```

---

## Diagrama de Secuencia: Aplicar Diseño

```
Client      Gateway    GeneticService    OrchardsService    MongoDB
  │            │              │                  │             │
  │ POST /designs/:id/apply   │                  │             │
  ├────────────>│              │                  │             │
  │            │ Validate JWT  │                  │             │
  │            ├──────────────>│                  │             │
  │            │              │ Get Design       │             │
  │            │              ├──────────────────────────────>│
  │            │              │◄─────────────────────────────┤
  │            │              │ Validate design is completed  │
  │            │              │ Validate user owns design     │
  │            │              │                  │             │
  │            │              │ Create Plants    │             │
  │            │              ├─────────────────>│             │
  │            │              │                  │ Save plants │
  │            │              │                  ├────────────>│
  │            │              │                  │◄────────────┤
  │            │              │◄─────────────────┤             │
  │            │              │ Update design    │             │
  │            │              │ (appliedToOrchard=true)       │
  │            │              ├──────────────────────────────>│
  │            │◄─────────────┤                  │             │
  │◄───────────┤              │                  │             │
  │ 200 OK     │              │                  │             │
```

---

## Consideraciones de Rendimiento

### Optimizaciones Implementadas:

1. **Procesamiento Asíncrono:**
   - Uso de Bull Queue para procesamiento en background
   - No bloquea el hilo principal de Node.js

2. **Paralelización:**
   - Workers paralelos para múltiples diseños
   - Evaluación de fitness en paralelo (donde sea posible)

3. **Caching:**
   - Redis para cachear datos de plantas
   - Redis para cachear compatibilidades
   - TTL de 24 horas

4. **Optimizaciones del Algoritmo:**
   - Elitismo: Mantener mejores individuos
   - Early stopping si fitness > 95
   - Lazy evaluation de constraints

5. **Límites:**
   - Máximo 3 diseños simultáneos por usuario
   - Timeout de 5 minutos por diseño
   - Máximo 200 plantas por diseño

---

## Variables de Entorno

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/genetic_designs_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Servicio
PORT=3005
NODE_ENV=development

# Otros servicios
ORCHARDS_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3006

# Algoritmo Genético (defaults)
DEFAULT_POPULATION_SIZE=100
DEFAULT_GENERATIONS=50
DEFAULT_MUTATION_RATE=0.1
DEFAULT_CROSSOVER_RATE=0.8

# Límites
MAX_CONCURRENT_DESIGNS_PER_USER=3
MAX_PLANTS_PER_DESIGN=200
DESIGN_TIMEOUT_MS=300000

# Workers
WORKER_CONCURRENCY=2
```

---

## Dependencias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "bull": "^4.12.0",
    "redis": "^4.6.11",
    "uuid": "^9.0.0",
    "joi": "^17.11.0",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "genetic-js": "^1.0.0",
    "mathjs": "^12.2.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bull": "^4.10.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

---

## Datos Semilla (Plant Data)

Cargar base de datos inicial con:
- 50+ especies comunes de plantas
- Matriz de compatibilidades
- Requisitos de crecimiento
- Datos de producción

Fuentes de datos:
- Companion Planting Guide
- USDA Plant Database
- Research papers sobre alelopatía

---

## Mejoras Futuras

1. Machine Learning para mejorar función de fitness
2. Consideración de clima y estacionalidad
3. Integración con datos meteorológicos
4. Simulación de crecimiento en el tiempo
5. Optimización multi-objetivo con frentes de Pareto
6. Visualización 3D de diseños
7. Recomendaciones basadas en diseños previos exitosos
8. Soporte para huertos verticales y en contenedores
