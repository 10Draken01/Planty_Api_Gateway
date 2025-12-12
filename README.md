# AG-Service - PlantGen Genetic Algorithm Microservice

Microservicio de optimización de huertos urbanos mediante Algoritmo Genético Multi-Objetivo.

## Descripción

Este servicio implementa un Algoritmo Genético (AG) basado en la metodología descrita en el documento LaTeX de PlantGen para generar configuraciones óptimas de huertos urbanos. El AG optimiza 4 métricas simultáneamente:

- **CEE** (Compatibilidad Entre Especies): Maximiza las relaciones beneficiosas entre plantas
- **PSRNT** (Satisfacción de Rendimiento Nutricional/Terapéutico): Alinea la distribución de categorías con objetivos del usuario
- **EH** (Eficiencia Hídrica): Optimiza el uso del agua disponible
- **UE** (Utilización de Espacio): Maximiza el aprovechamiento del área sin sobresaturar

## Tecnologías

- **Node.js** 18+ con **TypeScript**
- **Express** para API REST
- **MongoDB** para almacenamiento de plantas y matriz de compatibilidad
- **Arquitectura Hexagonal** (Clean Architecture)
- **Docker** y **Docker Compose**

## Arquitectura

```
ag-service/
├── src/
│   ├── domain/              # Lógica de negocio pura
│   │   ├── entities/        # Plant, Individual, Orchard
│   │   ├── value-objects/   # Dimensions, Position, Metrics
│   │   ├── services/        # AG, FitnessCalculator, Validation
│   │   └── repositories/    # Interfaces de repositorios
│   ├── application/         # Casos de uso
│   │   ├── use-cases/       # GenerateGardenUseCase
│   │   └── dtos/            # DTOs de entrada/salida
│   ├── infrastructure/      # Adaptadores externos
│   │   ├── http/            # Controllers, Routes
│   │   ├── persistence/     # MongoDB, Seeders
│   │   └── external/        # Clientes HTTP
│   └── config/              # Configuración y logging
```

## Instalación

### Prerequisitos

- Node.js >= 18
- MongoDB >= 7.0
- Docker y Docker Compose (opcional)

### Opción 1: Desarrollo Local

```bash
# Clonar repositorio
cd ag-service

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Iniciar MongoDB (si no está corriendo)
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  --name mongodb mongo:7.0

# Iniciar en modo desarrollo
npm run dev
```

### Opción 2: Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f ag-service

# Detener servicios
docker-compose down
```

## Uso

### Health Check

```bash
GET http://localhost:3005/v1/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "dbConnected": true,
  "collections": {
    "plants": 50,
    "matrix": 2500
  }
}
```

### Generar Huerto

```bash
POST http://localhost:3005/v1/generate
Content-Type: application/json

{
  "userId": "user-uuid",
  "dimensions": { "width": 2.0, "height": 1.0 },
  "waterLimit": 150,
  "userExperience": 2,
  "objective": "alimenticio",
  "categoryDistribution": {
    "vegetable": 50,
    "medicinal": 20,
    "ornamental": 10,
    "aromatic": 20
  }
}
```

**Todos los campos son opcionales.** Si no se envía body, el servicio generará valores aleatorios coherentes.

**Respuesta (Top 3 soluciones):**
```json
{
  "success": true,
  "solutions": [
    {
      "rank": 1,
      "layout": {
        "dimensions": { "width": 2.0, "height": 1.0, "totalArea": 2.0 },
        "plants": [
          {
            "plantId": 1,
            "name": "Cilantro",
            "scientificName": "Coriandrum sativum",
            "quantity": 3,
            "position": { "x": 0, "y": 0 },
            "area": 0.45,
            "type": ["aromatic", "medicinal"]
          }
        ],
        "totalPlants": 8,
        "usedArea": 1.7,
        "availableArea": 0.3,
        "categoryBreakdown": { "vegetable": 50, "aromatic": 30, "medicinal": 20, "ornamental": 0 }
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
        "weeklyWaterLiters": 120,
        "implementationCostMXN": 380,
        "maintenanceMinutesPerWeek": 80
      },
      "calendar": {
        "currentSeason": "Verano",
        "hemisphere": "north",
        "plantingSchedule": [...],
        "monthlyTasks": [...]
      },
      "compatibilityMatrix": [...]
    }
  ],
  "metadata": {
    "executionTimeMs": 2300,
    "totalGenerations": 87,
    "convergenceGeneration": 72,
    "populationSize": 40,
    "stoppingReason": "convergence",
    "weightsApplied": { "CEE": 0.20, "PSRNT": 0.50, "EH": 0.20, "UE": 0.10 }
  }
}
```

## Parámetros del Algoritmo Genético

Configurables via variables de entorno (`.env`):

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `AG_POPULATION_SIZE` | Tamaño de población | 40 |
| `AG_MAX_GENERATIONS` | Generaciones máximas | 150 |
| `AG_CROSSOVER_PROBABILITY` | Probabilidad de cruza | 0.85 |
| `AG_MUTATION_RATE` | Tasa de mutación | 0.08 |
| `AG_TOURNAMENT_K` | Tamaño de torneo | 3 |
| `AG_ELITE_COUNT` | Individuos élite | 3 |
| `AG_PATIENCE` | Generaciones sin mejora antes de parar | 20 |
| `AG_CONVERGENCE_THRESHOLD` | Umbral de varianza para convergencia | 0.001 |

## Pesos por Objetivo

El servicio ajusta automáticamente los pesos de las métricas según el objetivo:

| Objetivo | CEE | PSRNT | EH | UE |
|----------|-----|-------|----|----|
| **Alimenticio** | 0.20 | 0.50 | 0.20 | 0.10 |
| **Medicinal** | 0.25 | 0.45 | 0.15 | 0.15 |
| **Sostenible** | 0.25 | 0.20 | 0.40 | 0.15 |
| **Ornamental** | 0.20 | 0.40 | 0.15 | 0.25 |

## Validaciones

El servicio implementa 5 validaciones antes de aceptar una solución:

1. **BOTÁNICA**: Plantas existen en BD y son compatibles con clima Af (Chiapas)
2. **FÍSICA**: Área ocupada ≤ espacio disponible, UE ≤ 0.85
3. **TÉCNICA**: Tiempo de mantenimiento ≤ disponible según experiencia
4. **ECONÓMICA**: Costo ≤ presupuesto (si se especificó)
5. **AGRÍCOLA**: Sin compatibilidades críticas (< -0.5) entre plantas adyacentes

## Inicialización de Datos

Al iniciar, el servicio:

1. Conecta a MongoDB
2. Verifica si las colecciones están vacías
3. Si están vacías:
   - Carga 50 plantas desde `data/plants_with_id.json`
   - Carga matriz de compatibilidad desde `data/matriz_compatibilities.json`
4. Cachea la matriz de compatibilidad en memoria para performance

## Logging

Los logs se almacenan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

Nivel de log configurable via `LOG_LEVEL` (debug, info, warn, error).

## Testing

```bash
# Ejecutar tests unitarios
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Scripts

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run lint         # Linter
npm run format       # Formatter
```

## Variables de Entorno

Ver archivo [.env.example](.env.example) para todas las variables disponibles.

## Comunicación con Microservicios

### Users Service

- `GET /users/:id` - Obtener nivel de experiencia del usuario

### Notifications Service

- `POST /notify/user/:id` - Notificar huerto generado (opcional)

## Criterios de Parada del AG

El algoritmo se detiene cuando:

1. **Convergencia**: Varianza de fitness < 0.001
2. **Paciencia**: 20 generaciones sin mejora significativa
3. **Máximo de generaciones**: 150 generaciones alcanzadas
4. **Timeout**: Excede 30 segundos de ejecución

## Estructura de Datos

### Plantas (50 especies)

Ejemplo:
```json
{
  "id": 1,
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
```

### Matriz de Compatibilidad

Valores entre -1 (perjudicial) y 1 (beneficiosa):

```json
{
  "Cilantro": {
    "Tomate Cherry": 1.0,
    "Albahaca": 1.0,
    "Perejil": -0.5
  }
}
```

## Performance

- Tiempo promedio de ejecución: **2-5 segundos**
- Memoria utilizada: ~100 MB
- Generaciones típicas: 50-100 antes de convergencia

## Troubleshooting

### Error: "Cannot connect to MongoDB"

Verificar que MongoDB esté corriendo:
```bash
docker ps | grep mongo
```

### Error: "No plants found in database"

El seeder fallará si los archivos JSON no existen. Verificar:
```bash
ls data/plants_with_id.json
ls data/matriz_compatibilities.json
```

### AG toma mucho tiempo

Reducir parámetros en `.env`:
```bash
AG_POPULATION_SIZE=20
AG_MAX_GENERATIONS=100
```

## Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

MIT License - ver archivo LICENSE

## Contacto

PlantGen Team - plantgen@example.com

## Referencias

- Documento LaTeX PlantGen - Capítulo 3 (Algoritmo Genético)
- ISO/IEC 19761:2011 (COSMIC Function Points)
- Goldberg, D. E. (1989). Genetic Algorithms in Search, Optimization, and Machine Learning
