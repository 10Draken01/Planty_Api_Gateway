# API Documentation - AG-Service

Documentación completa de endpoints del microservicio AG-Service.

## Base URL

```
http://localhost:3005/v1
```

---

## Endpoints

### 1. Health Check

Verifica el estado del servicio y la conexión a MongoDB.

**Endpoint:** `GET /health`

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "dbConnected": true,
  "collections": {
    "plants": 50,
    "matrix": 2500
  }
}
```

**Response 500 (Error):**
```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Error message"
}
```

---

### 2. Generate Garden

Genera configuraciones óptimas de huerto usando Algoritmo Genético.

**Endpoint:** `POST /generate`

**Headers:**
```
Content-Type: application/json
```

#### Request Body (Todos los campos opcionales)

```typescript
{
  userId?: string;                    // ID del usuario (opcional)
  desiredPlants?: string[];           // Especies deseadas (ej: ["Cilantro", "Tomate Cherry"])
  dimensions?: {
    width: number;                    // Ancho en metros (0.5-10)
    height: number;                   // Alto en metros (0.5-10)
  };
  waterLimit?: number;                // Litros/semana disponibles
  userExperience?: 1 | 2 | 3;        // 1=principiante, 2=intermedio, 3=experto
  season?: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
  location?: {
    lat: number;                      // Latitud (-90 a 90)
    lon: number;                      // Longitud (-180 a 180)
  };
  categoryDistribution?: {
    vegetable?: number;               // Porcentaje (0-100)
    medicinal?: number;               // Porcentaje (0-100)
    ornamental?: number;              // Porcentaje (0-100)
    aromatic?: number;                // Porcentaje (0-100)
  };
  budget?: number;                    // Presupuesto en MXN
  objective?: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  maintenanceMinutes?: number;        // Minutos disponibles/semana
}
```

#### Valores por Defecto (si no se especifican)

| Campo | Default |
|-------|---------|
| `dimensions` | Área aleatoria 1-5 m² |
| `waterLimit` | 50-80 L/m²/semana |
| `userExperience` | 2 (intermedio) |
| `season` | Detectado automáticamente |
| `location` | Chiapas, México (16.75, -93.11) |
| `categoryDistribution` | 25% cada categoría |
| `budget` | 200 MXN/m² |
| `objective` | 'alimenticio' |
| `maintenanceMinutes` | 60 * userExperience |

#### Response 200 (Success)

```json
{
  "success": true,
  "solutions": [
    {
      "rank": 1,
      "layout": {
        "dimensions": {
          "width": 2.0,
          "height": 1.0,
          "totalArea": 2.0
        },
        "plants": [
          {
            "plantId": 1,
            "name": "Cilantro",
            "scientificName": "Coriandrum sativum",
            "quantity": 3,
            "position": { "x": 0.0, "y": 0.0 },
            "area": 0.45,
            "type": ["aromatic", "medicinal"]
          }
        ],
        "totalPlants": 8,
        "usedArea": 1.7,
        "availableArea": 0.3,
        "categoryBreakdown": {
          "vegetable": 50,
          "aromatic": 30,
          "medicinal": 20,
          "ornamental": 0
        }
      },
      "metrics": {
        "CEE": 0.8500,
        "PSRNT": 0.9000,
        "EH": 0.7500,
        "UE": 0.8000,
        "fitness": 0.8600
      },
      "estimations": {
        "monthlyProductionKg": 10.5,
        "weeklyWaterLiters": 120.0,
        "implementationCostMXN": 380.00,
        "maintenanceMinutesPerWeek": 120
      },
      "calendar": {
        "currentSeason": "Verano",
        "hemisphere": "north",
        "plantingSchedule": [
          {
            "plantId": 1,
            "plant": "Cilantro",
            "plantingWeek": 1,
            "harvestWeek": 6,
            "daysToHarvest": 38,
            "notes": "Temporada ideal para siembra. Mantener humedad constante."
          }
        ],
        "monthlyTasks": [
          {
            "month": "Junio",
            "week": 1,
            "tasks": [
              "Preparar sustrato",
              "Verificar drenaje",
              "Siembra inicial"
            ]
          }
        ]
      },
      "compatibilityMatrix": [
        {
          "plant1": "Cilantro",
          "plant2": "Tomate Cherry",
          "score": 1.0,
          "relation": "benefica"
        }
      ]
    }
    // ... 2 soluciones más (rank 2 y 3)
  ],
  "metadata": {
    "executionTimeMs": 2300,
    "totalGenerations": 87,
    "convergenceGeneration": 72,
    "populationSize": 40,
    "stoppingReason": "convergence",
    "inputParameters": { /* parámetros normalizados */ },
    "weightsApplied": {
      "CEE": 0.20,
      "PSRNT": 0.50,
      "EH": 0.20,
      "UE": 0.10
    }
  }
}
```

#### Response 400 (Validation Error)

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "\"dimensions.width\" must be between 0.5 and 10",
    "\"categoryDistribution\" must sum to 100"
  ]
}
```

#### Response 500 (Server Error)

```json
{
  "success": false,
  "message": "Error generando huerto",
  "error": "Detailed error message"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Request Vacío (Generación Aleatoria)

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

El servicio generará valores aleatorios coherentes.

---

### Ejemplo 2: Huerto Pequeño Alimenticio

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": { "width": 1.5, "height": 1.0 },
    "waterLimit": 100,
    "objective": "alimenticio",
    "userExperience": 1,
    "categoryDistribution": {
      "vegetable": 70,
      "aromatic": 20,
      "medicinal": 10,
      "ornamental": 0
    }
  }'
```

---

### Ejemplo 3: Huerto Medicinal Grande

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "dimensions": { "width": 3.0, "height": 2.0 },
    "waterLimit": 350,
    "budget": 1200,
    "objective": "medicinal",
    "userExperience": 3,
    "categoryDistribution": {
      "vegetable": 20,
      "aromatic": 20,
      "medicinal": 50,
      "ornamental": 10
    }
  }'
```

---

### Ejemplo 4: Huerto con Plantas Específicas

```bash
curl -X POST http://localhost:3005/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "desiredPlants": ["Cilantro", "Albahaca", "Tomate Cherry"],
    "dimensions": { "width": 2.0, "height": 1.5 },
    "waterLimit": 200,
    "objective": "alimenticio"
  }'
```

**Nota:** El AG intentará incluir las plantas deseadas si son compatibles con las restricciones.

---

## Métricas Explicadas

### CEE (Compatibilidad Entre Especies)

Valores: 0.0 - 1.0

- **0.0 - 0.3**: Baja compatibilidad (plantas con relaciones perjudiciales)
- **0.4 - 0.6**: Compatibilidad media (relaciones neutrales)
- **0.7 - 1.0**: Alta compatibilidad (relaciones beneficiosas)

### PSRNT (Satisfacción de Rendimiento)

Valores: 0.0 - 1.0

Mide qué tan bien la distribución de categorías se alinea con lo deseado.
- **1.0**: Distribución perfecta
- **0.8+**: Muy buena alineación
- **< 0.5**: Distribución alejada del objetivo

### EH (Eficiencia Hídrica)

Valores: 0.0 - 1.0

- **1.0**: Uso óptimo del agua (80-100% del límite)
- **0.5 - 0.8**: Uso moderado
- **< 0.5**: Subutilización o exceso de agua

### UE (Utilización de Espacio)

Valores: 0.0 - 1.0

- **1.0**: Utilización óptima (~85% del área)
- **0.8+**: Buena utilización
- **< 0.5**: Área subutilizada o sobresaturada

### Fitness (Combinada)

Suma ponderada de las 4 métricas según el objetivo.

- **0.85+**: Excelente configuración
- **0.70 - 0.84**: Buena configuración
- **0.50 - 0.69**: Configuración aceptable
- **< 0.50**: Configuración subóptima

---

## Stopping Reasons (Razones de Parada)

| Razón | Descripción |
|-------|-------------|
| `convergence` | Varianza de fitness < 0.001 |
| `patience` | 20 generaciones sin mejora |
| `max_generations` | Alcanzó 150 generaciones |
| `timeout` | Excedió 30 segundos |

---

## Rate Limiting

Actualmente no implementado. Considerar para producción.

## Authentication

Actualmente no implementado. El campo `userId` es opcional y no verificado.

## Versioning

API versión: `v1`

Cambios futuros usarán nuevas versiones (`v2`, `v3`, etc.)
