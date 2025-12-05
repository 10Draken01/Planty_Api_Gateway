# 📖 GUÍA DE USO: ALGORITMO GENÉTICO MEJORADO

## 🎯 Ejemplo Completo de Uso

### Escenario
Un usuario quiere crear un huerto de **50m²** con:
- Objetivo: Alimenticio
- Presupuesto: $5000 MXN
- Agua disponible: 200L/semana
- Plantas preferidas: Tomate, Albahaca, Lechuga, Zanahoria, Cilantro

---

## 📝 PASO 1: Ejecutar el Algoritmo Genético

```typescript
import { GenerateGardenUseCase } from './application/use-cases/GenerateGardenUseCase';
import { OrchardLayoutExporter } from './domain/services/OrchardLayoutExporter';

// Configurar restricciones
const constraints = {
  maxArea: 50,           // 50 m²
  maxWaterWeekly: 200,   // 200 L/semana
  maxBudget: 5000        // $5000 MXN
};

// Configurar preferencias
const preferences = {
  objective: 'alimenticio',
  selectedPlantIds: [1, 5, 8, 12, 15] // IDs de BD: Tomate, Albahaca, Lechuga, Zanahoria, Cilantro
};

// Ejecutar AG
const useCase = container.resolve(GenerateGardenUseCase);
const result = await useCase.execute({ constraints, preferences });

console.log(`Generaciones ejecutadas: ${result.generationsRun}`);
console.log(`Tiempo de ejecución: ${result.executionTime}ms`);
console.log(`Soluciones encontradas: ${result.solutions.length}`);
```

**Salida esperada**:
```
Generaciones ejecutadas: 150
Tiempo de ejecución: 2341ms
Soluciones encontradas: 3
```

---

## 📊 PASO 2: Analizar las Soluciones

```typescript
// Obtener top 3 soluciones
const [best, second, third] = result.solutions;

// Ver detalles de la mejor solución
console.log('=== MEJOR SOLUCIÓN ===');
console.log(`Fitness: ${(best.metrics.fitness * 100).toFixed(1)}%`);
console.log(`Total de plantas: ${best.layout.totalPlants}`);
console.log(`Área usada: ${best.layout.usedArea.toFixed(1)}m²`);
console.log(`Área disponible: ${best.layout.availableArea.toFixed(1)}m²`);

// Ver distribución de categorías
console.log('\nDistribución por tipo:');
console.log(`- Vegetales: ${best.layout.categoryBreakdown.vegetable}%`);
console.log(`- Medicinales: ${best.layout.categoryBreakdown.medicinal}%`);
console.log(`- Aromáticas: ${best.layout.categoryBreakdown.aromatic}%`);

// Ver métricas detalladas
console.log('\nMétricas de calidad:');
console.log(`- Compatibilidad (CEE): ${(best.metrics.CEE * 100).toFixed(1)}%`);
console.log(`- Balance nutricional (PSRNT): ${(best.metrics.PSRNT * 100).toFixed(1)}%`);
console.log(`- Eficiencia hídrica (EH): ${(best.metrics.EH * 100).toFixed(1)}%`);
console.log(`- Uso de espacio (UE): ${(best.metrics.UE * 100).toFixed(1)}%`);
```

**Salida esperada**:
```
=== MEJOR SOLUCIÓN ===
Fitness: 87.3%
Total de plantas: 18
Área usada: 42.5m²
Área disponible: 7.5m²

Distribución por tipo:
- Vegetales: 72%
- Medicinales: 0%
- Aromáticas: 28%

Métricas de calidad:
- Compatibilidad (CEE): 91.2%
- Balance nutricional (PSRNT): 85.4%
- Eficiencia hídrica (EH): 88.1%
- Uso de espacio (UE): 85.0%
```

---

## 🌱 PASO 3: Ver Distribución de Plantas

```typescript
// Ver plantas por especie
const plantsBySpecies = new Map<string, number>();

best.layout.plants.forEach(plant => {
  const species = plant.plant.species;
  plantsBySpecies.set(species, (plantsBySpecies.get(species) || 0) + 1);
});

console.log('\n=== DISTRIBUCIÓN DE PLANTAS ===');
plantsBySpecies.forEach((count, species) => {
  console.log(`${species}: ${count} plantas`);
});

// Ver posiciones específicas
console.log('\n=== POSICIONES (primeras 5) ===');
best.layout.plants.slice(0, 5).forEach((plant, idx) => {
  console.log(`${idx + 1}. ${plant.plant.species}`);
  console.log(`   Posición: (${plant.position.x.toFixed(2)}m, ${plant.position.y.toFixed(2)}m)`);
  console.log(`   Tamaño: ${plant.width.toFixed(2)}m × ${plant.height.toFixed(2)}m`);
});
```

**Salida esperada**:
```
=== DISTRIBUCIÓN DE PLANTAS ===
Tomate: 5 plantas
Albahaca: 3 plantas
Lechuga: 6 plantas
Zanahoria: 2 plantas
Cilantro: 2 plantas

=== POSICIONES (primeras 5) ===
1. Tomate
   Posición: (2.34m, 1.87m)
   Tamaño: 1.41m × 1.41m

2. Albahaca
   Posición: (4.12m, 2.05m)
   Tamaño: 0.71m × 0.71m

3. Lechuga
   Posición: (6.23m, 3.44m)
   Tamaño: 1.00m × 1.00m

4. Tomate
   Posición: (2.18m, 5.67m)
   Tamaño: 1.41m × 1.41m

5. Cilantro
   Posición: (8.45m, 1.23m)
   Tamaño: 0.71m × 0.71m
```

---

## 🔄 PASO 4: Exportar para api-orchard

```typescript
// Obtener el Individual de la mejor solución
const bestIndividual = best.individual;

// Exportar a formato api-orchard
const payload = OrchardLayoutExporter.exportIndividual(
  bestIndividual,
  'user-123',                    // userId
  'Mi Huerto Perfecto',          // nombre
  'Huerto optimizado por AG'     // descripción
);

console.log('\n=== PAYLOAD PARA API-ORCHARD ===');
console.log(JSON.stringify(payload, null, 2));
```

**Salida esperada**:
```json
{
  "userId": "user-123",
  "name": "Mi Huerto Perfecto",
  "description": "Huerto optimizado por AG",
  "width": 7.07,
  "height": 7.07,
  "plants": [
    {
      "plantId": 1,
      "x": 2.34,
      "y": 1.87,
      "width": 1.41,
      "height": 1.41,
      "rotation": 0
    },
    {
      "plantId": 5,
      "x": 4.12,
      "y": 2.05,
      "width": 0.71,
      "height": 0.71,
      "rotation": 0
    },
    // ... 16 plantas más
  ]
}
```

---

## ✅ PASO 5: Validar Antes de Enviar

```typescript
// Validar el payload
const { valid, errors } = OrchardLayoutExporter.validate(payload);

if (!valid) {
  console.error('❌ VALIDACIÓN FALLÓ:');
  errors.forEach(error => console.error(`  - ${error}`));
  throw new Error('Payload inválido');
}

console.log('✅ Payload validado correctamente');
```

---

## 📤 PASO 6: Enviar a api-orchard

```typescript
// Opción 1: Desde el backend
const response = await fetch('http://localhost:3004/orchards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(payload)
});

const createdOrchard = await response.json();
console.log('✅ Huerto creado con ID:', createdOrchard._id);

// Opción 2: Retornar al frontend para que lo envíe
return {
  message: 'Layout generado exitosamente',
  payload,          // El frontend lo enviará
  summary: OrchardLayoutExporter.generateSummary(bestIndividual),
  alternatives: [   // Opciones 2 y 3
    OrchardLayoutExporter.exportIndividual(second.individual, userId, 'Opción 2'),
    OrchardLayoutExporter.exportIndividual(third.individual, userId, 'Opción 3')
  ]
};
```

---

## 🎨 PASO 7: Visualización (Ejemplo para Frontend)

```typescript
// En el frontend, al recibir el payload
function renderOrchardLayout(payload) {
  const canvas = document.getElementById('orchard-canvas');
  const ctx = canvas.getContext('2d');

  // Configurar escala (1m = 50px)
  const scale = 50;
  canvas.width = payload.width * scale;
  canvas.height = payload.height * scale;

  // Dibujar límites del huerto
  ctx.strokeStyle = '#333';
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Dibujar cada planta
  payload.plants.forEach(plant => {
    const x = plant.x * scale;
    const y = plant.y * scale;
    const w = plant.width * scale;
    const h = plant.height * scale;

    // Color según especie
    ctx.fillStyle = getPlantColor(plant.plantId);
    ctx.fillRect(x, y, w, h);

    // Borde
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x, y, w, h);

    // Etiqueta
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(getPlantName(plant.plantId), x + 5, y + 15);
  });
}

function getPlantColor(plantId) {
  const colors = {
    1: '#FF6B6B',  // Tomate - rojo
    5: '#4ECDC4',  // Albahaca - verde agua
    8: '#95E1D3',  // Lechuga - verde claro
    12: '#FFA07A', // Zanahoria - naranja
    15: '#98D8C8'  // Cilantro - verde menta
  };
  return colors[plantId] || '#CCCCCC';
}
```

---

## 📊 PASO 8: Comparar las 3 Soluciones

```typescript
console.log('\n=== COMPARACIÓN DE SOLUCIONES ===\n');

result.solutions.forEach((solution, idx) => {
  console.log(`OPCIÓN ${idx + 1}:`);
  console.log(`  Fitness: ${(solution.metrics.fitness * 100).toFixed(1)}%`);
  console.log(`  Plantas: ${solution.layout.totalPlants}`);
  console.log(`  Área usada: ${solution.layout.usedArea.toFixed(1)}m²`);
  console.log(`  Compatibilidad: ${(solution.metrics.CEE * 100).toFixed(1)}%`);
  console.log(`  Agua semanal: ${solution.layout.totalWeeklyWater.toFixed(1)}L`);
  console.log(`  Costo: $${solution.layout.totalCost.toFixed(2)} MXN`);
  console.log('');
});
```

**Salida esperada**:
```
=== COMPARACIÓN DE SOLUCIONES ===

OPCIÓN 1:
  Fitness: 87.3%
  Plantas: 18
  Área usada: 42.5m²
  Compatibilidad: 91.2%
  Agua semanal: 156.3L
  Costo: $4725.00 MXN

OPCIÓN 2:
  Fitness: 85.1%
  Plantas: 16
  Área usada: 38.2m²
  Compatibilidad: 88.5%
  Agua semanal: 142.1L
  Costo: $4350.00 MXN

OPCIÓN 3:
  Fitness: 83.8%
  Plantas: 19
  Área usada: 45.1m²
  Compatibilidad: 86.3%
  Agua semanal: 168.7L
  Costo: $4890.00 MXN
```

---

## 🔍 PASO 9: Verificar Espaciamiento

```typescript
import { PlantSpacingService } from './domain/services/PlantSpacingService';

const spacingService = new PlantSpacingService();

// Verificar todas las plantas
console.log('\n=== VERIFICACIÓN DE ESPACIAMIENTO ===\n');

let violations = 0;
const plants = bestIndividual.plants;

for (let i = 0; i < plants.length; i++) {
  for (let j = i + 1; j < plants.length; j++) {
    const plant1 = plants[i];
    const plant2 = plants[j];

    const distance = plant1.distanceTo(plant2);
    const minDist = spacingService.calculateMinimumDistance(
      plant1.plant,
      plant2.plant
    );

    if (distance < minDist) {
      console.log(`⚠️ VIOLACIÓN:`);
      console.log(`   ${plant1.plant.species} ↔ ${plant2.plant.species}`);
      console.log(`   Distancia actual: ${distance.toFixed(2)}m`);
      console.log(`   Distancia mínima: ${minDist.toFixed(2)}m`);
      violations++;
    }
  }
}

if (violations === 0) {
  console.log('✅ Todas las plantas tienen espaciamiento adecuado');
} else {
  console.log(`⚠️ Se encontraron ${violations} violaciones de espaciamiento`);
}
```

**Salida esperada**:
```
=== VERIFICACIÓN DE ESPACIAMIENTO ===

✅ Todas las plantas tienen espaciamiento adecuado
```

---

## 📈 PASO 10: Generar Resumen Detallado

```typescript
const summary = OrchardLayoutExporter.generateSummary(bestIndividual);
console.log(summary);
```

**Salida esperada**:
```
============================================================
RESUMEN DEL LAYOUT DE HUERTO
============================================================

📏 Dimensiones: 7.1m × 7.1m
📊 Área total: 50.0m²
🌱 Total de plantas: 18
🏆 Score de fitness: 87.3%

📋 Distribución por especie:
   - Tomate: 5 plantas
   - Albahaca: 3 plantas
   - Lechuga: 6 plantas
   - Zanahoria: 2 plantas
   - Cilantro: 2 plantas

💧 Agua semanal: 156.3L
💰 Costo estimado: $4725.00 MXN

📈 Métricas de calidad:
   - Compatibilidad (CEE): 91.2%
   - Balance nutricional (PSRNT): 85.4%
   - Eficiencia hídrica (EH): 88.1%
   - Uso de espacio (UE): 85.0%

============================================================
```

---

## 🎯 CASO DE USO COMPLETO: API Endpoint

```typescript
// routes/garden.routes.ts
router.post('/generate-layout', async (req, res) => {
  try {
    const { constraints, preferences, userId } = req.body;

    // 1. Ejecutar AG
    const result = await generateGardenUseCase.execute({
      constraints,
      preferences
    });

    // 2. Obtener mejor solución
    const best = result.solutions[0];

    // 3. Exportar para api-orchard
    const payload = OrchardLayoutExporter.exportIndividual(
      best.individual,
      userId,
      'Huerto Generado',
      'Optimizado automáticamente'
    );

    // 4. Validar
    const { valid, errors } = OrchardLayoutExporter.validate(payload);
    if (!valid) {
      return res.status(400).json({ errors });
    }

    // 5. Retornar todo
    res.json({
      success: true,
      orchardPayload: payload,
      summary: OrchardLayoutExporter.generateSummary(best.individual),
      metrics: {
        fitness: best.metrics.fitness,
        totalPlants: best.layout.totalPlants,
        usedArea: best.layout.usedArea,
        availableArea: best.layout.availableArea
      },
      alternatives: result.solutions.slice(1, 3).map(sol =>
        OrchardLayoutExporter.exportIndividual(
          sol.individual,
          userId,
          `Opción Alternativa ${result.solutions.indexOf(sol) + 1}`
        )
      ),
      executionTime: result.executionTime,
      generationsRun: result.generationsRun
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Respuesta de la API**:
```json
{
  "success": true,
  "orchardPayload": {
    "userId": "user-123",
    "name": "Huerto Generado",
    "description": "Optimizado automáticamente",
    "width": 7.07,
    "height": 7.07,
    "plants": [...]
  },
  "summary": "============================================================\nRESUMEN DEL LAYOUT...",
  "metrics": {
    "fitness": 0.873,
    "totalPlants": 18,
    "usedArea": 42.5,
    "availableArea": 7.5
  },
  "alternatives": [...],
  "executionTime": 2341,
  "generationsRun": 150
}
```

---

## 🚀 ¡LISTO PARA USAR!

El sistema ahora está completamente integrado y listo para:

1. ✅ Generar layouts óptimos de huertos
2. ✅ Validar colisiones y espaciamiento
3. ✅ Exportar en formato compatible con api-orchard
4. ✅ Proporcionar múltiples alternativas
5. ✅ Generar resúmenes detallados
6. ✅ Garantizar coherencia en todas las posiciones

**¡Todo funciona y compila correctamente!** 🌱✨
