# 🧬 Algoritmo Genético Mejorado para Optimización de Huertos Urbanos

> **Versión 2.0** - Sistema inteligente de generación de configuraciones óptimas de huertos urbanos mediante Algoritmos Genéticos avanzados.

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Algoritmo Genético: Fundamentos](#algoritmo-genético-fundamentos)
5. [Funciones de Fitness](#funciones-de-fitness)
6. [Operadores Genéticos](#operadores-genéticos)
7. [Selección Inteligente de Plantas](#selección-inteligente-de-plantas)
8. [API y Endpoints](#api-y-endpoints)
9. [Ejemplos de Uso](#ejemplos-de-uso)
10. [Optimizaciones y Escalabilidad](#optimizaciones-y-escalabilidad)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Descripción General

El **Algoritmo Genético Mejorado** es un sistema de optimización multiobjetivo diseñado para generar configuraciones óptimas de huertos urbanos considerando:

- ✅ **Compatibilidad entre plantas** (alelopatía)
- ✅ **Eficiencia hídrica** y uso de recursos
- ✅ **Balance nutricional del suelo**
- ✅ **Sincronización de ciclos de crecimiento**
- ✅ **Preferencias del usuario** (especies deseadas)
- ✅ **Límites de especies** (3 o 5 especies máximo)
- ✅ **Objetivos específicos** (alimenticio, medicinal, sostenible, ornamental)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / CONTROLLER                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          ImprovedGenerateGardenUseCase (Caso de Uso)        │
│  - Orquesta todo el flujo                                   │
│  - Normaliza request                                        │
│  - Configura AG y Fitness                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Plant      │  │ Compatibility│  │ Fitness          │
│  Repository │  │ Matrix Repo  │  │ Calculator       │
└─────────────┘  └──────────────┘  └──────────────────┘
                                            │
                                            ▼
                         ┌──────────────────────────────────┐
                         │ ImprovedGeneticAlgorithm (Motor) │
                         │  - Inicialización heurística     │
                         │  - Selección por torneo          │
                         │  - Cruza uniforme                │
                         │  - Mutaciones múltiples          │
                         │  - Elitismo                      │
                         └──────────────────────────────────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         │                                     │
                         ▼                                     ▼
              ┌─────────────────────┐            ┌──────────────────────┐
              │ PlantSelectorService│            │ ImprovedFitness      │
              │ - Filtrado usuario  │            │ Calculator           │
              │ - Scoring inteligente│           │ - 6 métricas         │
              │ - Selección codiciosa│           │ - Pesos dinámicos    │
              └─────────────────────┘            └──────────────────────┘
```

---

## 🔧 Componentes Principales

### 1. **ImprovedGeneticAlgorithm** (`src/domain/services/ImprovedGeneticAlgorithm.ts`)

Motor principal del AG. Gestiona todo el ciclo evolutivo.

**Responsabilidades:**
- Inicialización heurística de la población
- Selección por torneo
- Cruza uniforme
- Mutaciones múltiples (swap, inserción, eliminación, cantidad)
- Reemplazo generacional con elitismo
- Criterios de parada inteligentes

**Configuración:**
```typescript
interface ImprovedGAConfig {
  populationSize: number;         // Tamaño de población (ej: 50)
  maxGenerations: number;         // Máximo de generaciones (ej: 100)
  crossoverProbability: number;   // Prob. de cruza (ej: 0.8)
  mutationRate: number;           // Prob. de mutación (ej: 0.2)
  insertionRate: number;          // Prob. de inserción de planta (ej: 0.1)
  deletionRate: number;           // Prob. de eliminación de planta (ej: 0.05)
  tournamentK: number;            // Tamaño del torneo (ej: 3)
  eliteCount: number;             // Individuos élite preservados (ej: 5)
  patience: number;               // Generaciones sin mejora antes de parar (ej: 20)
  convergenceThreshold: number;   // Umbral de varianza para convergencia (ej: 0.0001)
  timeout?: number;               // Timeout en ms (opcional)
  maxSpecies: number;             // Máximo de especies simultáneas (3 o 5)
}
```

---

### 2. **ImprovedFitnessCalculator** (`src/domain/services/ImprovedFitnessCalculator.ts`)

Calculador de fitness con **6 métricas mejoradas**.

**Métricas:**

| Métrica | Descripción | Mejoras |
|---------|-------------|---------|
| **CEE** | Compatibilidad Entre Especies | Penalización exponencial por incompatibilidad cercana |
| **PSRNT** | Satisfacción Rendimiento Nutricional/Terapéutico | Penalización cuadrática + bonus por diversidad |
| **EH** | Eficiencia Hídrica | Curva óptima 80-95%, penalización progresiva |
| **UE** | Utilización de Espacio | Óptimo 70-85%, penalización por sobresaturación |
| **CS** | Ciclos Sincronizados (NUEVO) | Premia ciclos de cosecha similares |
| **BSN** | Balance de Suelo y Nutrientes (NUEVO) | Evalúa diversidad de tipos de suelo |

**Pesos dinámicos por objetivo:**

```typescript
// Ejemplo: Objetivo "alimenticio"
{
  CEE: 0.15,   // Compatibilidad
  PSRNT: 0.40, // Rendimiento nutricional (prioridad)
  EH: 0.15,    // Eficiencia hídrica
  UE: 0.10,    // Uso de espacio
  CS: 0.10,    // Ciclos sincronizados
  BSN: 0.10    // Balance de suelo
}
```

---

### 3. **PlantSelectorService** (`src/domain/services/PlantSelectorService.ts`)

Servicio de selección inteligente de plantas.

**Estrategias:**
1. Filtrar por lista del usuario (`desiredPlants`)
2. Filtrar por estacionalidad
3. Scoring multicriterio:
   - Alineación con objetivo (30%)
   - Compatibilidad mutua (40%)
   - Eficiencia de recursos (20%)
   - Diversidad nutricional (10%)
4. Selección codiciosa verificando compatibilidad

**Ejemplo:**
```typescript
const selector = new PlantSelectorService({
  desiredPlantSpecies: ['tomate', 'albahaca', 'lechuga'],
  maxSpecies: 3,
  objective: 'alimenticio',
  compatibilityMatrix: compatMatrix,
});

const selected = selector.selectBestPlants(allPlants);
// Retorna: [Tomate, Albahaca, Lechuga] (si son compatibles)
```

---

### 4. **Chromosome** (`src/domain/value-objects/Chromosome.ts`)

Representación genética mejorada (grid 2D).

**Estructura:**
```typescript
interface Gene {
  plantId: number;   // ID de la especie
  quantity: number;  // Cantidad de plantas en la celda
}

// Cromosoma = matriz de genes
Chromosome {
  genes: (Gene | null)[][];  // null = celda vacía
  gridWidth: number;
  gridHeight: number;
}
```

**Ventajas:**
- Representación espacial explícita
- Facilita cálculo de vecindad
- Operadores genéticos más eficientes

---

## 🧬 Algoritmo Genético: Fundamentos

### Flujo Principal

```
1. INICIALIZACIÓN HEURÍSTICA
   ├─ Seleccionar plantas inteligentemente (PlantSelectorService)
   ├─ Generar población con distribución espacial
   └─ Evaluar fitness de todos los individuos

2. CICLO EVOLUTIVO (hasta convergencia o max generaciones)
   │
   ├─ SELECCIÓN (Torneo)
   │  └─ Elegir mejores individuos para reproducción
   │
   ├─ REPRODUCCIÓN
   │  ├─ Cruza uniforme (probabilidad 0.8)
   │  ├─ Mutación por swap (probabilidad 0.2)
   │  ├─ Mutación por inserción (probabilidad 0.1)
   │  ├─ Mutación por eliminación (probabilidad 0.05)
   │  └─ Mutación de cantidad (probabilidad 0.1)
   │
   ├─ EVALUACIÓN
   │  └─ Calcular fitness con 6 métricas
   │
   ├─ REEMPLAZO (Elitismo)
   │  └─ Preservar mejores individuos (μ+λ)
   │
   └─ CRITERIOS DE PARADA
      ├─ Paciencia: sin mejora en N generaciones
      ├─ Convergencia: varianza < umbral
      ├─ Max generaciones alcanzado
      └─ Timeout

3. RESULTADO
   └─ Retornar Top 3 soluciones
```

---

## 🎯 Funciones de Fitness

### CEE: Compatibilidad Entre Especies

**Objetivo:** Maximizar la compatibilidad, penalizar incompatibilidades cercanas.

**Fórmula:**
```
CEE = (Σ(compatibilidad_ij * peso_distancia_ij) / Σ(peso_distancia)) normalizado a [0,1]

donde:
  peso_distancia = exp(-distancia / 2)  // Peso exponencial inverso
  compatibilidad ∈ [-1, 1]              // De matriz de compatibilidad
```

**Penalizaciones:**
- Incompatibilidad fuerte (< -0.5) cercana (< 1.5m): **x2 penalización**
- Sinergia fuerte (> 0.5) cercana (< 1.0m): **x1.5 bonificación**

---

### PSRNT: Satisfacción de Rendimiento

**Objetivo:** Alinearse con distribución de categorías deseada.

**Fórmula:**
```
PSRNT = 1 - √(MSE) / 100

MSE = (Σ(actual_i - deseado_i)²) / 4

donde:
  i ∈ {vegetable, medicinal, aromatic, ornamental}
```

**Sin distribución deseada:** Se premia diversidad usando entropía de Shannon.

---

### EH: Eficiencia Hídrica

**Objetivo:** Usar 80-95% del agua disponible sin exceder.

**Curva de eficiencia:**
```
              1.0 ┤     ╭────────╮
                  │    ╱          ╲
              0.5 ┤   ╱            ╲___
                  │  ╱
              0.0 └──────────────────────
                  0%  80%  95% 100% 120%
                       Uso de Agua
```

**Penalización severa por exceso:**
```
si uso > 100%: fitness = max(0, 1 - (uso - 1.0) * 2)
```

---

### CS: Ciclos Sincronizados (NUEVO)

**Objetivo:** Premia plantas con ciclos de cosecha similares.

**Fórmula:**
```
CS = max(0, 1 - σ(harvestDays) / 60)

donde:
  σ = desviación estándar de días de cosecha
  60 = máxima desviación esperada
```

**Ventajas:**
- Facilita rotación de cultivos
- Simplifica mantenimiento
- Optimiza uso de espacio

---

### BSN: Balance de Suelo y Nutrientes (NUEVO)

**Objetivo:** Diversidad óptima de tipos de suelo (2-3 tipos).

**Puntuación:**
```
si tipos_suelo ∈ [2, 3]: BSN = 1.0
si tipos_suelo == 1:     BSN = 0.6  (monocultura)
si tipos_suelo > 3:      BSN = max(0.4, 1 - (tipos - 3) * 0.2)
```

---

## 🔄 Operadores Genéticos

### 1. Cruza Uniforme

**Descripción:** Intercambia plantas aleatoriamente entre padres.

**Pseudocódigo:**
```
para cada planta en max(len(padre1), len(padre2)):
  si random() < 0.5:
    hijo1 ← planta de padre1
    hijo2 ← planta de padre2
  sino:
    hijo1 ← planta de padre2
    hijo2 ← planta de padre1
```

**Ventaja:** Mayor diversidad genética que cruza de dos puntos.

---

### 2. Mutación por Swap

**Descripción:** Intercambia posición de dos plantas.

**Ejemplo:**
```
Antes:  [Tomate(0,0), Albahaca(1,1), Lechuga(2,2)]
                ↓ swap índices 0 y 2 ↓
Después: [Lechuga(0,0), Albahaca(1,1), Tomate(2,2)]
```

---

### 3. Mutación por Inserción (NUEVO)

**Descripción:** Inserta una nueva planta del pool.

**Restricciones:**
- Solo si `num_plantas < maxSpecies`
- Solo plantas no presentes en el individuo
- Verifica restricciones de área y agua

**Ventaja:** Explora nuevas combinaciones de especies.

---

### 4. Mutación por Eliminación (NUEVO)

**Descripción:** Elimina una planta aleatoria.

**Restricción:** Mantener al menos 2 especies.

**Ventaja:** Simplifica huertos sobrepoblados.

---

### 5. Mutación de Cantidad (NUEVO)

**Descripción:** Incrementa o decrementa cantidad de una planta.

**Ejemplo:**
```
Tomate: quantity = 3
   ↓ mutación +1
Tomate: quantity = 4
```

**Rango:** [1, 5] plantas por especie.

---

## 🌱 Selección Inteligente de Plantas

### Proceso de Scoring

Cada planta recibe un score basado en 4 criterios:

#### 1. Alineación con Objetivo (30%)

```typescript
// Ejemplo: Objetivo "alimenticio"
if (plant.hasType('vegetable')) {
  score_objetivo = 1.0;
} else {
  score_objetivo = 0.3;
}
```

#### 2. Compatibilidad Mutua (40%)

```typescript
compatibilidad_promedio =
  Σ(compatibilidad(planta, otra)) / num_plantas

score_compatibilidad = (compatibilidad_promedio + 1) / 2  // Normalizar
```

#### 3. Eficiencia de Recursos (20%)

```typescript
score_tamaño = max(0, 1 - size / 2)
score_agua = max(0, 1 - weeklyWatering / 100)

score_eficiencia = (score_tamaño + score_agua) / 2
```

#### 4. Diversidad Nutricional (10%)

```typescript
score_diversidad = min(1, num_tipos / 3)

// Ejemplo: planta con tipos [vegetable, aromatic] = 2/3 = 0.67
```

### Selección Codiciosa

```
1. Ordenar plantas por score descendente
2. Iterar sobre lista ordenada:
   a. Si compatibilidad con seleccionadas es buena:
      → Agregar a seleccionadas
   b. Si ya tenemos maxSpecies:
      → Detener
3. Retornar plantas seleccionadas
```

**Criterio de compatibilidad:** Máximo 1 incompatibilidad fuerte permitida.

---

## 🌐 API y Endpoints

### Endpoint Principal

```
POST /api/v1/generate
```

### Request Body

```json
{
  "userId": "user123",
  "desiredPlants": ["tomate", "albahaca", "lechuga", "zanahoria"],
  "maxPlantSpecies": 3,
  "dimensions": {
    "width": 2.5,
    "height": 2.0
  },
  "waterLimit": 150,
  "budget": 1000,
  "objective": "alimenticio",
  "categoryDistribution": {
    "vegetable": 70,
    "aromatic": 30
  },
  "season": "spring",
  "location": {
    "lat": 19.4326,
    "lon": -99.1332
  }
}
```

### Response

```json
{
  "success": true,
  "solutions": [
    {
      "rank": 1,
      "layout": {
        "dimensions": { "width": 2.5, "height": 2.0 },
        "plants": [
          {
            "plant": {
              "species": "tomate",
              "scientificName": "Solanum lycopersicum",
              "type": ["vegetable"]
            },
            "quantity": 3,
            "position": { "x": 0.5, "y": 0.5 }
          },
          {
            "plant": {
              "species": "albahaca",
              "scientificName": "Ocimum basilicum",
              "type": ["aromatic", "medicinal"]
            },
            "quantity": 2,
            "position": { "x": 1.5, "y": 0.5 }
          },
          {
            "plant": {
              "species": "lechuga",
              "scientificName": "Lactuca sativa",
              "type": ["vegetable"]
            },
            "quantity": 4,
            "position": { "x": 0.5, "y": 1.5 }
          }
        ],
        "totalPlants": 9,
        "usedArea": 3.8,
        "availableArea": 1.2,
        "categoryBreakdown": {
          "vegetable": 78,
          "aromatic": 22,
          "medicinal": 0,
          "ornamental": 0
        }
      },
      "metrics": {
        "CEE": 0.92,
        "PSRNT": 0.88,
        "EH": 0.95,
        "UE": 0.76,
        "fitness": 0.89
      },
      "estimations": {
        "monthlyProductionKg": 7.6,
        "weeklyWaterLiters": 142.5,
        "implementationCostMXN": 950.0,
        "maintenanceMinutesPerWeek": 135
      },
      "compatibilityMatrix": [
        {
          "plant1": "tomate",
          "plant2": "albahaca",
          "score": 0.8,
          "relation": "benefica"
        },
        {
          "plant1": "tomate",
          "plant2": "lechuga",
          "score": 0.4,
          "relation": "neutral"
        },
        {
          "plant1": "albahaca",
          "plant2": "lechuga",
          "score": 0.6,
          "relation": "benefica"
        }
      ],
      "calendar": { /* Calendario de siembra/cosecha */ }
    }
    // ... soluciones 2 y 3
  ],
  "metadata": {
    "executionTimeMs": 2340,
    "totalGenerations": 87,
    "convergenceGeneration": 87,
    "stoppingReason": "patience",
    "selectedPlants": [
      { "species": "tomate", "scientificName": "Solanum lycopersicum", "type": ["vegetable"] },
      { "species": "albahaca", "scientificName": "Ocimum basilicum", "type": ["aromatic"] },
      { "species": "lechuga", "scientificName": "Lactuca sativa", "type": ["vegetable"] }
    ],
    "weightsApplied": {
      "CEE": 0.15,
      "PSRNT": 0.40,
      "EH": 0.15,
      "UE": 0.10,
      "CS": 0.10,
      "BSN": 0.10
    }
  }
}
```

---

## 💡 Ejemplos de Uso

### Caso 1: Huerto Alimenticio con 3 Especies

```json
{
  "desiredPlants": ["tomate", "zanahoria", "lechuga", "cebolla"],
  "maxPlantSpecies": 3,
  "objective": "alimenticio",
  "dimensions": { "width": 3, "height": 2 },
  "waterLimit": 200
}
```

**Resultado esperado:**
- Tomate, Zanahoria, Lechuga (las 3 más compatibles y productivas)
- Fitness alto en PSRNT y CEE

---

### Caso 2: Huerto Medicinal con 5 Especies

```json
{
  "desiredPlants": ["menta", "romero", "lavanda", "manzanilla", "hierbabuena", "salvia"],
  "maxPlantSpecies": 5,
  "objective": "medicinal",
  "dimensions": { "width": 4, "height": 3 },
  "waterLimit": 300,
  "categoryDistribution": {
    "medicinal": 60,
    "aromatic": 40
  }
}
```

**Resultado esperado:**
- 5 especies aromáticas/medicinales seleccionadas inteligentemente
- Alta compatibilidad mutua
- Balance de tipos de suelo

---

### Caso 3: Huerto Sostenible (bajo consumo de agua)

```json
{
  "objective": "sostenible",
  "dimensions": { "width": 2, "height": 2 },
  "waterLimit": 80,
  "maxPlantSpecies": 3
}
```

**Resultado esperado:**
- Plantas de bajo riego (cactus, suculentas, aromáticas resistentes)
- EH cercano a 1.0
- Uso eficiente del agua

---

## ⚡ Optimizaciones y Escalabilidad

### 1. Paralelización de Evaluación

```typescript
// Evaluar población en paralelo
await Promise.all(
  population.map(ind => this.fitnessCalculator.calculate(ind))
);
```

### 2. Caché de Compatibilidad

```typescript
// Matriz de compatibilidad pre-cargada
const compatMatrix = await this.compatibilityRepo.getAllCompatibilities();
// Reutilizada en todos los cálculos de fitness
```

### 3. Early Stopping

```typescript
// Detener si no hay mejora en 'patience' generaciones
if (generationsWithoutImprovement >= this.config.patience) {
  break;
}
```

### 4. Configuración por Entorno

```typescript
// Desarrollo: poblaciones pequeñas, pocas generaciones
populationSize: 30
maxGenerations: 50

// Producción: poblaciones grandes, más generaciones
populationSize: 100
maxGenerations: 200
```

---

## 🐛 Troubleshooting

### Problema 1: Fitness estancado

**Síntoma:** Fitness no mejora después de varias generaciones.

**Soluciones:**
1. Aumentar `mutationRate` (de 0.2 a 0.3)
2. Aumentar `insertionRate` (de 0.1 a 0.15)
3. Reducir `eliteCount` para permitir más exploración
4. Verificar diversidad de población inicial

---

### Problema 2: Convergencia prematura

**Síntoma:** Todas las soluciones son muy similares.

**Soluciones:**
1. Aumentar `populationSize`
2. Reducir `tournamentK` (de 3 a 2)
3. Incrementar `convergenceThreshold`
4. Usar inicialización más diversa

---

### Problema 3: Restricciones no respetadas

**Síntoma:** Soluciones exceden área o agua disponible.

**Soluciones:**
1. Verificar validación en operadores genéticos
2. Aumentar penalización en función de fitness
3. Implementar reparación de individuos inválidos

---

### Problema 4: Plantas deseadas no aparecen

**Síntoma:** `desiredPlants` no se incluyen en la solución.

**Soluciones:**
1. Verificar nombres exactos (case-sensitive)
2. Revisar `PlantSelectorService` para errores de filtrado
3. Asegurar que las plantas existan en la base de datos
4. Aumentar `maxPlantSpecies` si es muy restrictivo

---

## 📚 Referencias

1. **Algoritmos Genéticos:**
   - Holland, J. H. (1992). *Genetic Algorithms*. Scientific American.
   - Goldberg, D. E. (1989). *Genetic Algorithms in Search, Optimization, and Machine Learning*.

2. **Agricultura Urbana:**
   - FAO (2014). *Growing Greener Cities in Latin America and the Caribbean*.
   - Mougeot, L. J. A. (2005). *Agropolis: The Social, Political, and Environmental Dimensions of Urban Agriculture*.

3. **Alelopatía y Compatibilidad:**
   - Rice, E. L. (1984). *Allelopathy*. Academic Press.
   - Liebman, M., & Dyck, E. (1993). *Crop rotation and intercropping strategies*.

---

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama con tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autores

- **Equipo Planty** - *Desarrollo e implementación*

---

## 🙏 Agradecimientos

- A la comunidad de agricultura urbana
- A los investigadores de algoritmos genéticos
- A todos los contribuidores del proyecto

---

**¿Preguntas?** Abre un issue en el repositorio o contacta al equipo de desarrollo.

---

*Última actualización: 2025-12-03*
