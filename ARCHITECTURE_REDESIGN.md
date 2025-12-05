# 🏗️ REDISE

ÑO ARQUITECTÓNICO: Sistema de Layout de Huertos con Posiciones

## 📋 Resumen Ejecutivo

Este documento describe el rediseño completo de los microservicios **api-orchard** y **api-ag** para implementar un sistema de layout de huertos con posicionamiento preciso de plantas.

---

## 🎯 Objetivos Cumplidos

### ✅ api-orchard
1. **Eliminado**: `plants_id: string[]`
2. **Agregado**: `plants: PlantInLayout[]` con posiciones (x, y)
3. **Agregado**: Value Objects (`Position`, `Dimensions`)
4. **Agregado**: Validación de colisiones y límites
5. **Agregado**: Casos de uso especializados para gestión de layout

### ✅ api-ag
- Genera huertos con plantas posicionadas
- No hay comunicación directa entre microservicios
- api-ag genera JSON, api-orchard lo consume

---

## 📐 Diseño del Dominio

### **Value Objects**

#### Position (Inmutable)
```typescript
class Position {
  constructor(
    public readonly x: number,
    public readonly y: number
  )

  distanceTo(other: Position): number
  equals(other: Position): boolean
}
```

**Ubicación**: `api-orchard/src/domain/value-objects/Position.ts`

**Razón del patrón**: Value Object de DDD. La posición es un concepto inmutable que no tiene identidad propia, solo valor. Dos posiciones son iguales si tienen las mismas coordenadas.

---

#### Dimensions (Inmutable)
```typescript
class Dimensions {
  constructor(
    public readonly width: number,
    public readonly height: number
  )

  get area(): number
  contains(position: Position): boolean
  containsRect(x, y, w, h): boolean
}
```

**Ubicación**: `api-orchard/src/domain/value-objects/Dimensions.ts`

**Razón del patrón**: Encapsula las dimensiones y su lógica de validación. Previene tener width/height negativos o cero.

---

### **Entities**

#### PlantInLayout (Entidad)
```typescript
class PlantInLayout {
  - id: string             // Identity
  - plantId: number        // ID de la planta original
  - position: Position
  - width: number
  - height: number
  - rotation: number       // 0, 90, 180, 270
  - status: 'planned' | 'planted' | 'growing' | 'harvested'

  getBoundingBox(): { x, y, width, height }
  overlaps(other: PlantInLayout): boolean
  moveTo(newPosition: Position): void
  markAsPlanted(): void
  rotate(): void
}
```

**Ubicación**: `api-orchard/src/domain/entities/PlantInLayout.ts`

**Razón del patrón**: Entity de DDD. Tiene identidad única (id). Representa UNA instancia específica de una planta en el layout. Puede haber múltiples instancias de la misma planta (mismo plantId) en diferentes posiciones.

---

#### Orchard (Aggregate Root)
```typescript
class Orchard {
  - _id: string
  - userId: string
  - name: string
  - dimensions: Dimensions
  - plants: PlantInLayout[]    // ✅ NUEVO
  - state: boolean

  // Métodos de negocio (INVARIANTES)
  addPlantToLayout(data): PlantInLayout
  removePlantFromLayout(id): void
  movePlant(id, newPosition): void

  // Validaciones privadas
  - isPlantWithinBounds(plant): boolean
  - findCollision(plant, excludeIds): PlantInLayout | null
}
```

**Ubicación**: `api-orchard/src/domain/entities/Orchard.ts`

**Razón del patrón**: **Aggregate Root** de DDD. Orchard es la raíz del agregado que contiene PlantInLayout. Protege las invariantes del dominio:
- Una planta NO puede estar fuera de los límites
- Dos plantas NO pueden solaparse (colisión)
- Solo se puede acceder a PlantInLayout a través de Orchard

Esto garantiza consistencia transaccional.

---

## 🔄 Casos de Uso (Application Layer)

### 1. CreateOrchardUseCase
**Entrada**:
```typescript
{
  userId: string
  name: string
  description: string
  width: number
  height: number
  state?: boolean
}
```

**Salida**: OrchardInfoDTO

**Lógica**:
1. Valida datos de entrada
2. Verifica unicidad de nombre por usuario
3. Crea Dimensions
4. Crea Orchard con plants = []
5. Persiste

**Ubicación**: `api-orchard/src/application/use-cases/CreateOrchardUseCase.ts`

---

### 2. AddPlantToOrchardLayoutUseCase ✅ NUEVO
**Entrada**:
```typescript
{
  orchardId: string
  plantId: number
  x: number
  y: number
  width?: number      // default: 1
  height?: number     // default: 1
  rotation?: number   // default: 0
}
```

**Salida**:
```typescript
{
  orchardId: string
  plantInstance: PlantInLayoutDTO
  message: string
}
```

**Lógica**:
1. Busca el huerto
2. Crea Position(x, y)
3. Llama a `orchard.addPlantToLayout()`
   - ✅ Valida límites
   - ✅ Valida colisiones
4. Persiste cambios

**Ubicación**: `api-orchard/src/application/use-cases/AddPlantToOrchardLayoutUseCase.ts`

**Razón del patrón**: Use Case de Clean Architecture. Orquesta la lógica de aplicación pero delega las reglas de negocio al dominio.

---

### 3. MovePlantInLayoutUseCase ✅ NUEVO
**Entrada**:
```typescript
{
  orchardId: string
  plantInstanceId: string
  newX: number
  newY: number
}
```

**Lógica**:
1. Busca el huerto
2. Crea nueva Position
3. Llama a `orchard.movePlant()`
   - ✅ Valida límites en nueva posición
   - ✅ Valida colisiones en nueva posición
4. Persiste

**Ubicación**: `api-orchard/src/application/use-cases/MovePlantInLayoutUseCase.ts`

---

### 4. RemovePlantFromLayoutUseCase ✅ NUEVO
**Entrada**:
```typescript
{
  orchardId: string
  plantInstanceId: string
}
```

**Ubicación**: `api-orchard/src/application/use-cases/RemovePlantFromLayoutUseCase.ts`

---

## 💾 Capa de Persistencia

### MongoOrchardRepository

**Métodos clave**:
```typescript
class MongoOrchardRepository {
  // Conversión Domain ↔ MongoDB
  private toDomain(doc: any): Orchard
  private toDocument(orchard: Orchard): any

  // CRUD
  save(orchard: Orchard): Promise<Orchard>
  findById(id: string): Promise<Orchard | null>
  update(orchard: Orchard): Promise<Orchard>

  // Nuevos
  existsByUserAndName(userId, name): Promise<boolean>
}
```

**Ubicación**: `api-orchard/src/infrastructure/repositories/MongoOrchardRepository.ts`

**Aspectos clave**:

1. **Hidratación correcta**:
```typescript
private toDomain(doc: any): Orchard {
  // Reconstruye Dimensions
  const dimensions = new Dimensions(doc.width, doc.height);

  // Reconstruye cada PlantInLayout con su Position
  const plants = (doc.plants || []).map(plantData => {
    const position = new Position(plantData.position.x, plantData.position.y);
    return PlantInLayout.fromPersistence({
      id: plantData.id,
      plantId: plantData.plantId,
      position,
      width: plantData.width,
      height: plantData.height,
      rotation: plantData.rotation,
      status: plantData.status
    });
  });

  return Orchard.fromPersistence({ ..., dimensions, plants });
}
```

2. **Serialización**:
```typescript
private toDocument(orchard: Orchard): any {
  const json = orchard.toJSON();
  return {
    _id: json._id,
    userId: json.userId,
    width: json.width,
    height: json.height,
    plants: json.plants, // Ya serializado por PlantInLayout.toJSON()
    ...
  };
}
```

**Razón del patrón**: Repository Pattern. Abstrae la persistencia del dominio. El dominio no conoce MongoDB.

---

## 🗄️ Estructura de MongoDB

### Documento Orchard (NUEVO)
```json
{
  "_id": "uuid-v4",
  "userId": "user123",
  "name": "Mi Huerto",
  "description": "Descripción",
  "width": 10,
  "height": 8,
  "plants": [
    {
      "id": "plant-instance-uuid-1",
      "plantId": 42,
      "position": {
        "x": 2,
        "y": 3
      },
      "width": 1,
      "height": 1,
      "rotation": 0,
      "status": "planted",
      "plantedAt": "2025-12-04T..."
    },
    {
      "id": "plant-instance-uuid-2",
      "plantId": 42,
      "position": {
        "x": 5,
        "y": 3
      },
      "width": 1,
      "height": 1,
      "rotation": 0,
      "status": "planned"
    }
  ],
  "state": true,
  "createAt": "2025-12-01T...",
  "updateAt": "2025-12-04T...",
  "timeOfLife": 3,
  "streakOfDays": 10
}
```

### Índices
```javascript
// Índice para búsquedas por usuario
{ userId: 1 }

// Índice compuesto para unicidad de nombre por usuario
{ userId: 1, name: 1 }

// Índice para filtrar activos/inactivos por usuario
{ userId: 1, state: 1 }

// Índice para ordenamiento
{ createAt: -1 }
```

---

## 📦 DTOs (Data Transfer Objects)

### Entrada

```typescript
interface CreateOrchardDTO {
  userId: string;
  name: string;
  description: string;
  width: number;
  height: number;
  state?: boolean;
}

interface AddPlantToLayoutDTO {
  plantId: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
}
```

### Salida

```typescript
interface PlantInLayoutDTO {
  id: string;
  plantId: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  rotation: number;
  status: 'planned' | 'planted' | 'growing' | 'harvested';
  plantedAt?: Date;
}

interface OrchardInfoDTO {
  _id: string;
  userId: string;
  name: string;
  width: number;
  height: number;
  area: number;
  availableArea: number;  // ✅ NUEVO
  plants: PlantInLayoutDTO[];
  countPlants: number;
  ...
}
```

**Ubicación**: `api-orchard/src/application/dtos/OrchardDTOs.ts`

---

## 🔄 Migración de Base de Datos

### Script: `001_migrate_orchards_to_layout_system.ts`

**Ubicación**: `api-orchard/migrations/001_migrate_orchards_to_layout_system.ts`

### Ejecución:

```bash
# Migración
cd api-orchard
npx ts-node migrations/001_migrate_orchards_to_layout_system.ts

# Rollback
npx ts-node migrations/001_migrate_orchards_to_layout_system.ts rollback
```

### ¿Qué hace?

1. **Migración**:
   - Elimina `plants_id: string[]`
   - Agrega `plants: []` (vacío)
   - Asegura `width` y `height` existan

2. **Rollback**:
   - Restaura `plants_id: []`
   - Elimina `plants`

---

## 🎨 Patrones Aplicados

### 1. **Aggregate Pattern** (DDD)
- **Orchard** es la raíz
- **PlantInLayout** es parte del agregado
- Solo se persiste a través de Orchard
- Garantiza consistencia transaccional

### 2. **Value Object Pattern** (DDD)
- **Position**: Inmutable, sin identidad
- **Dimensions**: Encapsula validaciones

### 3. **Entity Pattern** (DDD)
- **PlantInLayout**: Tiene identidad única (id)
- Puede cambiar estado (position, status)

### 4. **Repository Pattern** (Clean Arch)
- Abstrae persistencia
- Hidratación/Serialización del dominio

### 5. **Use Case Pattern** (Clean Arch)
- Casos de uso específicos por acción
- Orquesta lógica de aplicación
- Delega reglas de negocio al dominio

### 6. **Factory Methods**
- `Orchard.create()` para nuevos
- `Orchard.fromPersistence()` para reconstruir
- Encapsula construcción compleja

---

## 📝 Siguiente Paso: Controladores HTTP

Falta implementar:
1. OrchardController (actualizado)
2. Rutas HTTP
3. Validación de entrada
4. Manejo de errores

¿Quieres que continúe con la implementación de los controladores y rutas?

---

## 🔗 Flujo Completo

```
Cliente HTTP
    ↓
Controller (Presentation)
    ↓
Use Case (Application)
    ↓
Orchard Entity (Domain) ← Valida invariantes
    ↓
Repository (Infrastructure)
    ↓
MongoDB
```

---

## ✅ Resumen de Archivos Creados/Modificados

### ✅ Creados:
1. `api-orchard/src/domain/value-objects/Position.ts`
2. `api-orchard/src/domain/value-objects/Dimensions.ts`
3. `api-orchard/src/domain/entities/PlantInLayout.ts`
4. `api-orchard/src/application/use-cases/AddPlantToOrchardLayoutUseCase.ts`
5. `api-orchard/src/application/use-cases/MovePlantInLayoutUseCase.ts`
6. `api-orchard/src/application/use-cases/RemovePlantFromLayoutUseCase.ts`
7. `api-orchard/migrations/001_migrate_orchards_to_layout_system.ts`

### ✅ Actualizados:
1. `api-orchard/src/domain/entities/Orchard.ts` (completamente rediseñado)
2. `api-orchard/src/domain/repositories/OrchardRepository.ts`
3. `api-orchard/src/application/use-cases/CreateOrchardUseCase.ts`
4. `api-orchard/src/application/dtos/OrchardDTOs.ts`
5. `api-orchard/src/infrastructure/repositories/MongoOrchardRepository.ts`

---

Generado el: 2025-12-04
Autor: Claude (Arquitecto de Software)
