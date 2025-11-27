# AG-Service - Arquitectura del Sistema

Documentación técnica de la arquitectura del microservicio AG-Service.

## Visión General

AG-Service implementa un **Algoritmo Genético Multi-Objetivo** para optimización de huertos urbanos utilizando **Arquitectura Hexagonal** (Clean Architecture) con Node.js/TypeScript.

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | Node.js | 18+ |
| Lenguaje | TypeScript | 5.3+ |
| Framework Web | Express | 4.18+ |
| Base de Datos | MongoDB | 7.0+ |
| ORM | Mongoose | 8.0+ |
| Validación | Joi | 17.11+ |
| Logging | Winston | 3.11+ |
| HTTP Client | Axios | 1.6+ |
| Containerización | Docker | Latest |

## Arquitectura Hexagonal

```
┌─────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     HTTP     │  │   MongoDB    │  │   External   │      │
│  │ (Controllers)│  │ (Repositories)│  │   Services   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
├─────────┼─────────────────┼─────────────────┼──────────────┤
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌────────────────────────────────────────────────────┐    │
│  │             APPLICATION (Use Cases)                 │    │
│  │  • GenerateGardenUseCase                           │    │
│  │  • SaveOrchardUseCase                              │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                      │
├──────────────────────┼──────────────────────────────────────┤
│                      ▼                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │                   DOMAIN (Core)                     │    │
│  │                                                     │    │
│  │  Entities:                                          │    │
│  │    • Plant, Individual, Orchard                     │    │
│  │                                                     │    │
│  │  Value Objects:                                     │    │
│  │    • Dimensions, Position, Metrics                  │    │
│  │                                                     │    │
│  │  Domain Services:                                   │    │
│  │    • GeneticAlgorithmService                        │    │
│  │    • FitnessCalculatorService                       │    │
│  │    • ValidationService                              │    │
│  │    • CalendarGeneratorService                       │    │
│  │                                                     │    │
│  │  Repository Interfaces:                             │    │
│  │    • PlantRepository                                │    │
│  │    • CompatibilityMatrixRepository                  │    │
│  │    • OrchardRepository                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de Directorios

```
ag-service/
├── src/
│   ├── domain/                      # Núcleo de la lógica de negocio
│   │   ├── entities/                # Entidades de dominio
│   │   │   ├── Plant.ts             # 50 especies de plantas
│   │   │   ├── PlantInstance.ts     # Planta en layout con posición
│   │   │   ├── Individual.ts        # Individuo del AG (solución)
│   │   │   └── Orchard.ts           # Huerto persistible
│   │   ├── value-objects/           # Objetos de valor inmutables
│   │   │   ├── Dimensions.ts        # Dimensiones del huerto
│   │   │   ├── Position.ts          # Posición 2D
│   │   │   ├── Metrics.ts           # CEE, PSRNT, EH, UE
│   │   │   └── CategoryDistribution.ts
│   │   ├── services/                # Servicios de dominio
│   │   │   ├── GeneticAlgorithmService.ts    # Motor del AG
│   │   │   ├── FitnessCalculatorService.ts   # Cálculo de fitness
│   │   │   ├── ValidationService.ts          # 5 validaciones
│   │   │   └── CalendarGeneratorService.ts   # Calendario de siembra
│   │   └── repositories/            # Interfaces de repositorios
│   │       ├── PlantRepository.ts
│   │       ├── CompatibilityMatrixRepository.ts
│   │       └── OrchardRepository.ts
│   │
│   ├── application/                 # Casos de uso
│   │   ├── use-cases/
│   │   │   └── GenerateGardenUseCase.ts     # Orquesta el AG
│   │   ├── dtos/                    # Data Transfer Objects
│   │   │   ├── GenerateGardenRequestDto.ts
│   │   │   └── GenerateGardenResponseDto.ts
│   │   └── services/
│   │       └── SeasonDetectorService.ts
│   │
│   ├── infrastructure/              # Adaptadores externos
│   │   ├── http/                    # Capa HTTP
│   │   │   ├── controllers/
│   │   │   │   ├── HealthController.ts
│   │   │   │   └── GenerateController.ts
│   │   │   ├── middlewares/
│   │   │   │   └── ErrorHandlerMiddleware.ts
│   │   │   └── routes/
│   │   │       └── index.ts
│   │   ├── persistence/             # Persistencia
│   │   │   ├── mongodb/
│   │   │   │   ├── schemas/         # Schemas Mongoose
│   │   │   │   ├── MongoPlantRepository.ts
│   │   │   │   ├── MongoCompatibilityMatrixRepository.ts
│   │   │   │   ├── MongoOrchardRepository.ts
│   │   │   │   └── connection.ts
│   │   │   └── seeders/
│   │   │       └── DataSeeder.ts    # Inicialización de datos
│   │   └── external/                # Clientes externos
│   │       ├── UsersServiceClient.ts
│   │       └── NotificationsServiceClient.ts
│   │
│   ├── config/                      # Configuración
│   │   ├── env.ts                   # Variables de entorno
│   │   └── logger.ts                # Winston config
│   │
│   └── main.ts                      # Punto de entrada
│
├── data/                            # Datos JSON
│   ├── plants_with_id.json          # 50 plantas
│   └── matriz_compatibilities.json  # 2500 entradas
│
├── tests/                           # Tests
│   ├── unit/
│   └── integration/
│
├── logs/                            # Logs (generados)
│
├── Dockerfile                       # Multi-stage build
├── docker-compose.yml               # Orquestación
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Flujo de Datos - POST /generate

```
1. HTTP Request
   ↓
2. GenerateController
   ↓ (validación Joi)
3. GenerateGardenUseCase
   ↓
4. Normalización de Request (defaults)
   ↓
5. Cargar Plantas y Matriz (MongoDB)
   ↓
6. Crear FitnessCalculatorService
   ↓
7. Crear GeneticAlgorithmService
   ↓
8. Ejecutar AG (ciclo evolutivo)
   ├─ Inicialización de población (40 individuos)
   ├─ Loop: max 150 generaciones
   │  ├─ Selección por Torneo (k=3)
   │  ├─ Cruza de Dos Puntos (prob 0.85)
   │  ├─ Mutación por Intercambio (tasa 0.08)
   │  ├─ Evaluación de Fitness
   │  │  ├─ Calcular CEE
   │  │  ├─ Calcular PSRNT
   │  │  ├─ Calcular EH
   │  │  └─ Calcular UE
   │  ├─ Reemplazo Elitista (μ+λ)
   │  └─ Verificar criterios de parada
   └─ Retornar top 3 soluciones
   ↓
9. Generar Calendarios (CalendarGeneratorService)
   ↓
10. Transformar a DTOs
    ↓
11. HTTP Response (JSON)
```

## Algoritmo Genético - Detalle

### Parámetros

```typescript
{
  populationSize: 40,              // Tamaño de población
  maxGenerations: 150,             // Generaciones máximas
  crossoverProbability: 0.85,      // Probabilidad de cruza
  mutationRate: 0.08,              // Tasa de mutación
  tournamentK: 3,                  // Tamaño de torneo
  eliteCount: 3,                   // Individuos élite
  patience: 20,                    // Generaciones sin mejora
  convergenceThreshold: 0.001      // Umbral de convergencia
}
```

### Representación de Individuo

```typescript
Individual {
  dimensions: Dimensions          // Ancho x Alto
  genome: (number | null)[][]     // Matriz de IDs (no usado en v1)
  plants: PlantInstance[]         // Array de plantas con posiciones
  metrics: Metrics                // CEE, PSRNT, EH, UE, fitness
}
```

### Operadores Genéticos

#### 1. Selección por Torneo (k=3)
- Selecciona 3 individuos aleatorios
- Retorna el de mayor fitness
- Se ejecuta N veces (N = tamaño de población)

#### 2. Cruza de Dos Puntos (prob 0.85)
```
Padre1: [A, B, C | D, E, F | G, H]
Padre2: [1, 2, 3 | 4, 5, 6 | 7, 8]
         ↓  ↓  ↓   ╔═══╗   ↓  ↓
Hijo1:  [A, B, C | 4, 5, 6 | G, H]
Hijo2:  [1, 2, 3 | D, E, F | 7, 8]
```

#### 3. Mutación por Intercambio (tasa 0.08)
```
Antes: [A, B, C, D, E, F]
              ↕        ↕
Después: [A, E, C, D, B, F]
```

#### 4. Reemplazo Elitista (μ+λ)
- Combina padres (μ) e hijos (λ)
- Ordena por fitness
- Selecciona los mejores N

### Funciones de Fitness

#### CEE (Compatibilidad Entre Especies)

```typescript
CEE = Σ(compatibilidad(i,j) * peso_distancia(i,j)) / Σ(pesos)

peso_distancia = 1 / (distancia + 1)

// Normalización: [-1, 1] → [0, 1]
CEE_normalizada = (CEE + 1) / 2
```

#### PSRNT (Satisfacción de Rendimiento)

```typescript
PSRNT = 1 - √(MSE(distribución_actual, distribución_deseada)) / 100

MSE = Σ(actual_i - deseado_i)² / 4
```

#### EH (Eficiencia Hídrica)

```typescript
if (agua_usada > agua_max) {
  EH = max(0, 1 - exceso/agua_max - 0.5)
} else if (0.8 ≤ agua_usada/agua_max ≤ 1.0) {
  EH = 1.0  // Óptimo
} else {
  EH = agua_usada / (agua_max * 0.8)
}
```

#### UE (Utilización de Espacio)

```typescript
if (área_usada/área_total > 0.85) {
  UE = max(0, 1 - (uso - 0.85) * 5)  // Penalizar sobresaturación
} else {
  UE = área_usada / (área_total * 0.85)
}
```

#### Fitness Ponderado

```typescript
fitness = w_CEE * CEE + w_PSRNT * PSRNT + w_EH * EH + w_UE * UE

// Pesos según objetivo:
objetivos = {
  alimenticio:  { CEE: 0.20, PSRNT: 0.50, EH: 0.20, UE: 0.10 },
  medicinal:    { CEE: 0.25, PSRNT: 0.45, EH: 0.15, UE: 0.15 },
  sostenible:   { CEE: 0.25, PSRNT: 0.20, EH: 0.40, UE: 0.15 },
  ornamental:   { CEE: 0.20, PSRNT: 0.40, EH: 0.15, UE: 0.25 }
}
```

## Validaciones

### 1. BOTÁNICA
- ✅ Plantas existen en BD
- ✅ Compatible con clima tropical Af (Chiapas)

### 2. FÍSICA
- ✅ Área ocupada ≤ área disponible
- ✅ Utilización de espacio UE ≤ 0.85

### 3. TÉCNICA
- ✅ Tiempo de mantenimiento ≤ disponible según experiencia
- Principiante: 60 min/semana
- Intermedio: 120 min/semana
- Experto: 180 min/semana

### 4. ECONÓMICA
- ✅ Costo ≤ presupuesto (si se especificó)
- Costo estimado: 50 MXN/m² por planta

### 5. AGRÍCOLA
- ✅ Sin compatibilidades críticas (< -0.5) entre plantas adyacentes
- Adyacente: distancia < 1.0 metro

## Inicialización de Base de Datos

```typescript
1. Conectar a MongoDB
2. Verificar colecciones vacías:
   - if (plants.count === 0)
       → Cargar data/plants_with_id.json (50 plantas)
   - if (matrix.count === 0)
       → Cargar data/matriz_compatibilities.json (2500 entradas)
3. Crear índices:
   - plants: { species: 1 } unique
   - plants: { type: 1 }
   - matrix: { plant1: 1, plant2: 1 } unique
4. Cachear matriz en memoria (Map<string, Map<string, number>>)
5. Log resultado
```

## Performance

### Benchmarks

| Métrica | Valor Típico |
|---------|--------------|
| Tiempo de ejecución | 2-5 segundos |
| Generaciones hasta convergencia | 50-100 |
| Memoria RAM | ~100 MB |
| Tamaño de respuesta JSON | ~50-100 KB |

### Optimizaciones

1. **Cache de Matriz de Compatibilidad**: Cargada en memoria al inicio
2. **Índices MongoDB**: Búsquedas O(1) en plantas
3. **Elitismo**: Preserva mejores soluciones sin reevaluar
4. **Timeout**: Retorna mejor solución parcial si excede 30s
5. **Generaciones adaptativas**: Para por convergencia (no siempre 150)

## Seguridad

### Implementado
- ✅ Helmet (headers de seguridad)
- ✅ CORS habilitado
- ✅ Validación de inputs (Joi)
- ✅ Manejo de errores centralizado

### Pendiente (Producción)
- ⚠️ Rate limiting
- ⚠️ Autenticación/Autorización
- ⚠️ Encriptación de datos sensibles
- ⚠️ API Key management

## Escalabilidad

### Horizontal Scaling

El servicio es **stateless** y puede escalarse horizontalmente:

```yaml
# Kubernetes deployment example
replicas: 3
strategy:
  type: RollingUpdate
```

### Vertical Scaling

Ajustar parámetros del AG para mayor rendimiento:

```bash
AG_POPULATION_SIZE=80
AG_MAX_GENERATIONS=300
```

## Monitoreo

### Health Checks

- `GET /health` - Estado del servicio
- Verifica conexión a MongoDB
- Cuenta de documentos en colecciones

### Logs

- **Winston** con niveles: debug, info, warn, error
- Logs estructurados (JSON)
- Rotación de archivos
- Logs por generación cada 10 iteraciones

### Métricas Recomendadas (Producción)

- Tiempo de respuesta del AG
- Generaciones promedio hasta convergencia
- Tasa de éxito/error
- Uso de CPU/memoria
- Latencia de MongoDB

## Integración con Otros Servicios

### Users Service
```typescript
GET /users/:id
→ Obtener experiencia del usuario
```

### Notifications Service
```typescript
POST /notify/user/:id
→ Notificar huerto generado (opcional)
```

## Testing

### Unit Tests
```bash
npm test
```

Tests de:
- Operadores genéticos (cruza, mutación, selección)
- Cálculo de fitness (CEE, PSRNT, EH, UE)
- Validaciones
- Value Objects

### Integration Tests
```bash
npm run test:integration
```

Tests de:
- Endpoint /generate
- Conexión a MongoDB
- DataSeeder

## Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/deployment.yaml
```

## Versionado

- **API Version**: v1
- **Semantic Versioning**: 1.0.0
- Cambios breaking → nueva versión de API (v2, v3, etc.)

## Referencias

- Clean Architecture (Robert C. Martin)
- Genetic Algorithms in Search, Optimization, and Machine Learning (Goldberg, 1989)
- Documento LaTeX PlantGen - Capítulo 3
- TypeScript Best Practices
- Mongoose Official Documentation
