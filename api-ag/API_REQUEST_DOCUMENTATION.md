# 📖 Documentación Completa del API Request - Generación de Huertos

> Guía detallada de todas las propiedades del endpoint `/api/v1/generate/improved`

---

## 📋 Índice

1. [Endpoint](#endpoint)
2. [Propiedades Requeridas vs Opcionales](#propiedades-requeridas-vs-opcionales)
3. [Descripción Detallada de Cada Propiedad](#descripción-detallada-de-cada-propiedad)
4. [Ejemplos Completos](#ejemplos-completos)
5. [Validaciones y Restricciones](#validaciones-y-restricciones)
6. [Errores Comunes](#errores-comunes)

---

## 🌐 Endpoint

```
POST /api/v1/generate/improved
Content-Type: application/json
```

---

## ✅ Propiedades Requeridas vs Opcionales

### ❌ Ninguna Propiedad es REQUERIDA

**Todas las propiedades son opcionales.** El sistema aplicará valores por defecto inteligentes si no se especifican.

### 📊 Resumen Rápido

| Propiedad | Tipo | Requerida | Default |
|-----------|------|-----------|---------|
| `userId` | string | ❌ No | `undefined` |
| `desiredPlantIds` | number[] | ❌ No | `[]` (todas las plantas) |
| `maxPlantSpecies` | 3 \| 5 | ❌ No | `5` |
| `dimensions` | object | ❌ No | Aleatorio (1-5 m²) |
| `waterLimit` | number | ❌ No | Auto (50-80 L/m²/semana) |
| `userExperience` | 1 \| 2 \| 3 | ❌ No | `2` (Intermedio) |
| `season` | string | ❌ No | `'auto'` |
| `location` | object | ❌ No | CDMX (19.4326, -99.1332) |
| `categoryDistribution` | object | ❌ No | Balanceado (25% c/u) |
| `budget` | number | ❌ No | 200 MXN/m² |
| `objective` | string | ❌ No | `'alimenticio'` |
| `maintenanceMinutes` | number | ❌ No | Auto (60-180 min/semana) |

---

## 📝 Descripción Detallada de Cada Propiedad

### 1. `userId` (opcional)

**Tipo:** `string`

**Descripción:** Identificador único del usuario que solicita la generación del huerto.

**Uso:**
- Para asociar el huerto generado con un usuario específico
- Para tracking y analytics
- Para personalización futura basada en histórico

**Ejemplo:**
```json
{
  "userId": "user_12345abc"
}
```

**Default:** `undefined` (huerto anónimo)

**Validaciones:**
- ✅ Cualquier string válido
- ✅ Puede ser UUID, MongoDB ObjectId, o ID numérico

**Cuándo usar:**
- ✅ Cuando el usuario está autenticado
- ❌ No usar en generaciones de prueba o demos

---

### 2. `desiredPlantIds` (opcional) ⭐ **MEJORADO**

**Tipo:** `number[]` (array de enteros positivos)

**Descripción:** **IDs de las plantas que el usuario desea incluir en su huerto.** El sistema seleccionará inteligentemente las mejores combinaciones de esta lista.

**Flujo:**
1. Usuario envía array de IDs: `[1, 5, 12, 18, 23]`
2. Sistema consulta BD y obtiene plantas completas
3. `PlantSelectorService` evalúa y selecciona las mejores según:
   - Compatibilidad mutua
   - Alineación con objetivo
   - Eficiencia de recursos
   - Máximo de especies (`maxPlantSpecies`)

**Ejemplo:**
```json
{
  "desiredPlantIds": [1, 5, 12, 18, 23],
  "maxPlantSpecies": 3
}
```
**Resultado:** Sistema selecciona 3 de las 5 plantas (ej: IDs 1, 5, 12)

**Default:** `[]` (todas las plantas disponibles en BD)

**Validaciones:**
- ✅ Array de números enteros positivos
- ✅ IDs deben existir en la base de datos
- ❌ No se permiten IDs duplicados
- ❌ No se permiten IDs negativos o cero

**Ventajas de usar IDs:**
- ✅ **Body más limpio** (solo números)
- ✅ **Sin ambigüedad** (nombres pueden duplicarse)
- ✅ **Más eficiente** (consulta directa por ID)
- ✅ **Internacional** (no depende de idioma)

**Cómo obtener IDs:**
Consulta el endpoint de catálogo:
```bash
GET /api/v1/plants
```

**Cuándo usar:**
- ✅ Usuario tiene preferencias específicas de plantas
- ✅ Usuario ya exploró el catálogo
- ❌ No usar si quieres que el sistema elija libremente

---

### 3. `maxPlantSpecies` (opcional)

**Tipo:** `3 | 5` (solo estos dos valores)

**Descripción:** Máximo número de especies diferentes simultáneas en el huerto.

**Razón de Límite:**
- **3 especies:** Ideal para principiantes, fácil mantenimiento
- **5 especies:** Para usuarios avanzados, mayor diversidad

**Ejemplo:**
```json
{
  "maxPlantSpecies": 3
}
```

**Default:** `5`

**Validaciones:**
- ✅ Solo acepta `3` o `5`
- ❌ No acepta otros números (ej: 4, 6, 10)

**Impacto:**
- Con `maxPlantSpecies: 3` y `desiredPlantIds: [1,2,3,4,5]`:
  → Sistema selecciona 3 mejores
- Con `maxPlantSpecies: 5` y `desiredPlantIds: [1,2]`:
  → Sistema usa las 2 y puede agregar 3 más del catálogo

**Cuándo usar:**
- ✅ `3`: Usuarios principiantes, espacios pequeños
- ✅ `5`: Usuarios avanzados, espacios medianos/grandes

---

### 4. `dimensions` (opcional)

**Tipo:** `object`

**Estructura:**
```typescript
{
  width: number;   // Ancho en metros
  height: number;  // Alto en metros
}
```

**Descripción:** Dimensiones físicas del huerto en metros.

**Ejemplo:**
```json
{
  "dimensions": {
    "width": 2.5,
    "height": 2.0
  }
}
```
**Área total:** 2.5 × 2.0 = 5 m²

**Default:** Aleatorio entre 1-5 m² con ratio 0.5-2.0

**Validaciones:**
- ✅ `width`: 0.5 - 10 metros
- ✅ `height`: 0.5 - 10 metros
- ❌ No se permiten valores negativos o cero
- ⚠️ Área máxima: 100 m² (10×10)

**Consideraciones:**
- **Pequeño** (1-3 m²): 2-4 especies, bajo mantenimiento
- **Mediano** (3-6 m²): 3-5 especies, mantenimiento moderado
- **Grande** (6-10 m²): 4-5 especies, alto mantenimiento

**Cuándo usar:**
- ✅ Usuario conoce exactamente el espacio disponible
- ❌ No usar si quieres que el sistema sugiera un tamaño

---

### 5. `waterLimit` (opcional)

**Tipo:** `number` (litros/semana)

**Descripción:** Cantidad máxima de agua disponible por semana en litros.

**Ejemplo:**
```json
{
  "waterLimit": 150
}
```
**Significado:** Máximo 150 litros de agua por semana

**Default:** Auto-calculado: `área × (50-80)` L/m²/semana

**Validaciones:**
- ✅ Debe ser ≥ 0
- ⚠️ Si es muy bajo (< 20L), se limitarán las opciones de plantas
- ⚠️ Si es muy alto (> 500L), puede ser desperdicio

**Rangos Recomendados:**
- **Sostenible:** 30-50 L/m²/semana
- **Normal:** 50-80 L/m²/semana
- **Abundante:** 80-120 L/m²/semana

**Ejemplo por Área:**
- Huerto de 2 m² → 100-160 L/semana
- Huerto de 5 m² → 250-400 L/semana

**Impacto:**
- Límite bajo → Sistema priorizará plantas de bajo riego (cactus, aromáticas)
- Límite alto → Sistema puede incluir plantas demandantes (tomate, lechuga)

**Cuándo usar:**
- ✅ Usuario tiene restricción de agua
- ✅ Objetivo `'sostenible'`
- ❌ No especificar si no hay restricción

---

### 6. `userExperience` (opcional)

**Tipo:** `1 | 2 | 3`

**Descripción:** Nivel de experiencia del usuario en agricultura/jardinería.

**Valores:**
- `1`: **Principiante** - Sin experiencia previa
- `2`: **Intermedio** - Algo de experiencia
- `3`: **Avanzado** - Experiencia significativa

**Ejemplo:**
```json
{
  "userExperience": 1
}
```

**Default:** `2` (Intermedio)

**Impacto:**
- **Nivel 1:**
  - Plantas fáciles de cultivar
  - Mantenimiento simple
  - Pocas especies (favorece `maxPlantSpecies: 3`)
- **Nivel 2:**
  - Plantas de dificultad media
  - Mantenimiento moderado
- **Nivel 3:**
  - Plantas complejas permitidas
  - Mayor diversidad
  - Mantenimiento intensivo aceptable

**Validaciones:**
- ✅ Solo acepta `1`, `2`, o `3`

**Cuándo usar:**
- ✅ Para personalizar según habilidades del usuario
- ✅ En flujos de onboarding

---

### 7. `season` (opcional)

**Tipo:** `'auto' | 'spring' | 'summer' | 'autumn' | 'winter'`

**Descripción:** Estación del año para optimizar selección de plantas.

**Valores:**
- `'auto'`: Sistema detecta automáticamente según fecha y ubicación
- `'spring'`: Primavera (marzo-mayo)
- `'summer'`: Verano (junio-agosto)
- `'autumn'`: Otoño (septiembre-noviembre)
- `'winter'`: Invierno (diciembre-febrero)

**Ejemplo:**
```json
{
  "season": "spring"
}
```

**Default:** `'auto'`

**Impacto:**
- Filtra plantas según su mejor época de siembra
- Considera ciclos de crecimiento
- Optimiza para cosecha en temporada

**Validaciones:**
- ✅ Solo valores listados arriba

**Cuándo usar:**
- ✅ Usuario quiere plantar en estación específica
- ✅ Para planificación futura
- ❌ Dejar en `'auto'` para máxima flexibilidad

---

### 8. `location` (opcional)

**Tipo:** `object`

**Estructura:**
```typescript
{
  lat: number;   // Latitud (-90 a 90)
  lon: number;   // Longitud (-180 a 180)
}
```

**Descripción:** Ubicación geográfica del huerto para optimización climática.

**Ejemplo:**
```json
{
  "location": {
    "lat": 19.4326,
    "lon": -99.1332
  }
}
```
**Ubicación:** Ciudad de México

**Default:**
```json
{
  "lat": 19.4326,
  "lon": -99.1332
}
```

**Validaciones:**
- ✅ `lat`: -90 a 90
- ✅ `lon`: -180 a 180

**Uso Futuro:**
- Cálculo de horas de sol
- Temperaturas promedio
- Calendario de siembra local
- Integración con APIs meteorológicas

**Cuándo usar:**
- ✅ Usuario en ubicación diferente a CDMX
- ✅ Para resultados más precisos

---

### 9. `categoryDistribution` (opcional)

**Tipo:** `object`

**Estructura:**
```typescript
{
  vegetable?: number;   // 0-100 (porcentaje)
  medicinal?: number;   // 0-100
  ornamental?: number;  // 0-100
  aromatic?: number;    // 0-100
}
```

**Descripción:** Distribución deseada de categorías de plantas en porcentajes.

**Ejemplo:**
```json
{
  "categoryDistribution": {
    "vegetable": 70,
    "aromatic": 30
  }
}
```
**Significado:** 70% vegetales, 30% aromáticas

**Default:**
```json
{
  "vegetable": 25,
  "medicinal": 25,
  "ornamental": 25,
  "aromatic": 25
}
```

**Validaciones:**
- ✅ Cada valor: 0-100
- ⚠️ No necesitan sumar 100 (el sistema normaliza)

**Categorías:**
- **vegetable:** Comestibles (tomate, lechuga, zanahoria)
- **medicinal:** Propiedades terapéuticas (menta, manzanilla)
- **aromatic:** Aromáticas (albahaca, romero, lavanda)
- **ornamental:** Decorativas (flores, suculentas)

**Impacto en Fitness:**
La métrica **PSRNT** (Satisfacción de Rendimiento) evalúa qué tan cerca está el resultado de esta distribución.

**Ejemplos de Uso:**

**Huerto 100% Alimenticio:**
```json
{
  "categoryDistribution": {
    "vegetable": 100,
    "medicinal": 0,
    "ornamental": 0,
    "aromatic": 0
  }
}
```

**Huerto Medicinal:**
```json
{
  "categoryDistribution": {
    "medicinal": 60,
    "aromatic": 40
  }
}
```

**Cuándo usar:**
- ✅ Usuario tiene preferencia clara de categoría
- ✅ Complementa bien con `objective`
- ❌ No especificar si se quiere diversidad balanceada

---

### 10. `budget` (opcional)

**Tipo:** `number` (MXN)

**Descripción:** Presupuesto máximo disponible para implementación del huerto en pesos mexicanos.

**Ejemplo:**
```json
{
  "budget": 1000
}
```
**Significado:** Máximo $1,000 MXN

**Default:** Auto-calculado: `área × 200` MXN/m²

**Validaciones:**
- ✅ Debe ser ≥ 0

**Incluye:**
- Semillas/plántulas
- Tierra/sustrato
- Contenedores (si es necesario)
- Herramientas básicas

**Rangos Típicos:**
- **Económico:** 100-300 MXN/m²
- **Estándar:** 300-600 MXN/m²
- **Premium:** 600-1000+ MXN/m²

**Ejemplo por Área:**
- Huerto de 2 m² → $400-1200 MXN
- Huerto de 5 m² → $1000-3000 MXN

**Impacto:**
- Presupuesto bajo → Plantas más económicas (de semilla)
- Presupuesto alto → Permite plántulas y mejores sustratos

**Cuándo usar:**
- ✅ Usuario tiene restricción presupuestaria
- ✅ Para proyectos comunitarios con fondos limitados
- ❌ No especificar si presupuesto no es limitante

---

### 11. `objective` (opcional)

**Tipo:** `'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental'`

**Descripción:** Objetivo principal del huerto. **Afecta directamente los pesos de la función de fitness.**

**Valores:**

#### `'alimenticio'` (default)
**Prioridad:** Producción de alimentos

**Pesos de Fitness:**
```typescript
{
  CEE: 0.15,     // Compatibilidad
  PSRNT: 0.40,   // Rendimiento nutricional (⭐ ALTA)
  EH: 0.15,      // Eficiencia hídrica
  UE: 0.10,      // Uso de espacio
  CS: 0.10,      // Ciclos sincronizados
  BSN: 0.10      // Balance de suelo
}
```

**Plantas favorecidas:**
- Tomate, lechuga, zanahoria, rábano
- Vegetales de ciclo corto
- Alta producción por m²

**Ejemplo:**
```json
{
  "objective": "alimenticio",
  "categoryDistribution": {
    "vegetable": 80,
    "aromatic": 20
  }
}
```

---

#### `'medicinal'`
**Prioridad:** Plantas con propiedades terapéuticas

**Pesos de Fitness:**
```typescript
{
  CEE: 0.20,     // Compatibilidad
  PSRNT: 0.35,   // Rendimiento (⭐ ALTA)
  EH: 0.10,      // Eficiencia hídrica
  UE: 0.10,      // Uso de espacio
  CS: 0.10,      // Ciclos sincronizados
  BSN: 0.15      // Balance de suelo (importante)
}
```

**Plantas favorecidas:**
- Menta, romero, lavanda, manzanilla
- Hierbas medicinales
- Aromáticas con propiedades

**Ejemplo:**
```json
{
  "objective": "medicinal",
  "categoryDistribution": {
    "medicinal": 60,
    "aromatic": 40
  }
}
```

---

#### `'sostenible'`
**Prioridad:** Bajo consumo de recursos

**Pesos de Fitness:**
```typescript
{
  CEE: 0.20,     // Compatibilidad
  PSRNT: 0.15,   // Rendimiento
  EH: 0.30,      // Eficiencia hídrica (⭐ MUY ALTA)
  UE: 0.10,      // Uso de espacio
  CS: 0.10,      // Ciclos sincronizados
  BSN: 0.15      // Balance de suelo (importante)
}
```

**Plantas favorecidas:**
- Cactus, suculentas
- Aromáticas resistentes (romero, tomillo)
- Plantas de bajo riego

**Ejemplo:**
```json
{
  "objective": "sostenible",
  "waterLimit": 50
}
```

---

#### `'ornamental'`
**Prioridad:** Estética y decoración

**Pesos de Fitness:**
```typescript
{
  CEE: 0.15,     // Compatibilidad
  PSRNT: 0.30,   // Rendimiento (especies decorativas)
  EH: 0.10,      // Eficiencia hídrica
  UE: 0.20,      // Uso de espacio (⭐ ALTA)
  CS: 0.10,      // Ciclos sincronizados
  BSN: 0.15      // Balance de suelo
}
```

**Plantas favorecidas:**
- Flores, plantas ornamentales
- Aromáticas vistosas (lavanda)
- Distribución espacial armónica

**Ejemplo:**
```json
{
  "objective": "ornamental",
  "categoryDistribution": {
    "ornamental": 60,
    "aromatic": 40
  }
}
```

---

**Default:** `'alimenticio'`

**Validaciones:**
- ✅ Solo valores listados arriba

**Cuándo usar:**
- ✅ Siempre especificar para mejores resultados
- ✅ Combinar con `categoryDistribution` para máximo control

---

### 12. `maintenanceMinutes` (opcional)

**Tipo:** `number` (minutos/semana)

**Descripción:** Tiempo disponible por semana para mantenimiento del huerto.

**Ejemplo:**
```json
{
  "maintenanceMinutes": 120
}
```
**Significado:** 2 horas por semana

**Default:** Auto-calculado según `userExperience`:
- Nivel 1: 60 min/semana
- Nivel 2: 120 min/semana
- Nivel 3: 180 min/semana

**Validaciones:**
- ✅ Debe ser ≥ 0

**Estimación por Planta:**
- Promedio: **15 minutos/planta/semana**
- Incluye: riego, poda, control de plagas, cosecha

**Ejemplos:**
- 3 plantas → ~45 min/semana
- 5 plantas → ~75 min/semana
- 10 plantas → ~150 min/semana

**Impacto:**
- Poco tiempo → Sistema limita número de plantas
- Mucho tiempo → Permite huertos más complejos

**Cuándo usar:**
- ✅ Usuario tiene tiempo limitado
- ✅ Para dimensionar correctamente el huerto
- ❌ No especificar si tiempo no es limitante

---

## 📚 Ejemplos Completos

### Ejemplo 1: Request Mínimo (Sin Propiedades)

```json
{}
```

**Resultado:**
- Dimensiones aleatorias (1-5 m²)
- Objetivo: alimenticio
- 5 especies máximo
- Todas las plantas disponibles

---

### Ejemplo 2: Usuario Principiante con Espacio Pequeño

```json
{
  "userId": "user_789",
  "maxPlantSpecies": 3,
  "dimensions": {
    "width": 2,
    "height": 1.5
  },
  "userExperience": 1,
  "objective": "alimenticio"
}
```

**Resultado:**
- Huerto de 3 m²
- 3 especies fáciles de cultivar
- Enfoque en producción de alimentos

---

### Ejemplo 3: Huerto Medicinal con Plantas Específicas

```json
{
  "userId": "user_456",
  "desiredPlantIds": [15, 22, 31, 45, 67, 88],
  "maxPlantSpecies": 5,
  "objective": "medicinal",
  "categoryDistribution": {
    "medicinal": 70,
    "aromatic": 30
  },
  "waterLimit": 100,
  "dimensions": {
    "width": 3,
    "height": 2
  }
}
```

**Resultado:**
- Sistema selecciona 5 de las 6 plantas especificadas
- Prioriza medicinales y aromáticas
- Optimiza para bajo consumo de agua (100L/semana)
- Huerto de 6 m²

---

### Ejemplo 4: Huerto Sostenible

```json
{
  "objective": "sostenible",
  "waterLimit": 50,
  "dimensions": {
    "width": 2,
    "height": 2
  },
  "maxPlantSpecies": 3
}
```

**Resultado:**
- Plantas de bajo riego
- Máximo 50L/semana
- 3 especies resistentes
- Huerto de 4 m²

---

### Ejemplo 5: Usuario Avanzado con Control Total

```json
{
  "userId": "user_advanced_123",
  "desiredPlantIds": [1, 3, 7, 12, 18, 25, 34],
  "maxPlantSpecies": 5,
  "dimensions": {
    "width": 4,
    "height": 3
  },
  "waterLimit": 300,
  "userExperience": 3,
  "season": "spring",
  "location": {
    "lat": 25.6866,
    "lon": -100.3161
  },
  "categoryDistribution": {
    "vegetable": 60,
    "aromatic": 30,
    "medicinal": 10
  },
  "budget": 2000,
  "objective": "alimenticio",
  "maintenanceMinutes": 180
}
```

**Resultado:**
- Huerto de 12 m²
- 5 especies de las 7 solicitadas
- Optimizado para primavera en Monterrey
- Presupuesto de $2000 MXN
- 180 min/semana de mantenimiento

---

## ⚠️ Validaciones y Restricciones

### Validación del Schema (Joi)

El sistema valida automáticamente todas las propiedades. Si una validación falla, retorna error 400:

```json
{
  "success": false,
  "error": "Validation error: dimensions.width must be between 0.5 and 10"
}
```

### Tabla de Validaciones

| Propiedad | Tipo | Min | Max | Valores Permitidos |
|-----------|------|-----|-----|--------------------|
| `userId` | string | - | - | Cualquier string |
| `desiredPlantIds` | number[] | 1 | ∞ | Enteros positivos |
| `maxPlantSpecies` | number | - | - | Solo `3` o `5` |
| `dimensions.width` | number | 0.5 | 10 | Metros |
| `dimensions.height` | number | 0.5 | 10 | Metros |
| `waterLimit` | number | 0 | ∞ | Litros/semana |
| `userExperience` | number | - | - | `1`, `2`, o `3` |
| `season` | string | - | - | Ver lista arriba |
| `location.lat` | number | -90 | 90 | Grados |
| `location.lon` | number | -180 | 180 | Grados |
| `categoryDistribution.*` | number | 0 | 100 | Porcentaje |
| `budget` | number | 0 | ∞ | MXN |
| `objective` | string | - | - | Ver lista arriba |
| `maintenanceMinutes` | number | 0 | ∞ | Minutos |

---

## ❌ Errores Comunes

### Error 1: IDs de Plantas Inválidos

**Request:**
```json
{
  "desiredPlantIds": [999, 1000]
}
```

**Error:**
```json
{
  "success": false,
  "error": "Plant IDs not found: 999, 1000"
}
```

**Solución:** Verificar que los IDs existan en BD

---

### Error 2: `maxPlantSpecies` Inválido

**Request:**
```json
{
  "maxPlantSpecies": 4
}
```

**Error:**
```json
{
  "success": false,
  "error": "Validation error: maxPlantSpecies must be one of [3, 5]"
}
```

**Solución:** Usar solo `3` o `5`

---

### Error 3: Dimensiones Fuera de Rango

**Request:**
```json
{
  "dimensions": {
    "width": 15,
    "height": 2
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Validation error: dimensions.width must be less than or equal to 10"
}
```

**Solución:** Usar valores entre 0.5 y 10

---

### Error 4: Coordenadas Inválidas

**Request:**
```json
{
  "location": {
    "lat": 120,
    "lon": -99
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Validation error: location.lat must be less than or equal to 90"
}
```

**Solución:** Usar rangos válidos (-90 a 90 para lat, -180 a 180 para lon)

---

## 🎯 Mejores Prácticas

### 1. Siempre Especificar `objective`

✅ **Bueno:**
```json
{
  "objective": "alimenticio"
}
```

❌ **Malo:**
```json
{}
```

**Razón:** El objetivo afecta significativamente los pesos de fitness.

---

### 2. Usar `desiredPlantIds` cuando hay Preferencias

✅ **Bueno:**
```json
{
  "desiredPlantIds": [1, 5, 12],
  "maxPlantSpecies": 3
}
```

❌ **Malo:**
```json
{
  "maxPlantSpecies": 3
}
```

**Razón:** Mayor control sobre especies seleccionadas.

---

### 3. Combinar `objective` con `categoryDistribution`

✅ **Bueno:**
```json
{
  "objective": "alimenticio",
  "categoryDistribution": {
    "vegetable": 80,
    "aromatic": 20
  }
}
```

**Razón:** Máxima personalización.

---

### 4. Especificar `dimensions` si se Conoce el Espacio

✅ **Bueno:**
```json
{
  "dimensions": {
    "width": 2.5,
    "height": 2
  }
}
```

**Razón:** Resultados más realistas y aplicables.

---

## 📞 Soporte

**Dudas sobre propiedades:**
- Email: api-support@planty.com
- Docs: https://docs.planty.com/api
- Slack: #planty-api

---

**Última actualización:** 2025-12-03
**Versión API:** 2.0
