/**
 * Data Transfer Objects (DTOs) para Orchards
 *
 * ACTUALIZADO para soportar layout con posiciones
 */

import { PlantInLayout } from "@domain/entities/PlantInLayout";

// ===== DTOs de ENTRADA =====

// DTO para crear un nuevo huerto
export interface CreateOrchardDTO {
  userId: string;
  name: string;
  description: string;
  plants: PlantInLayout[];
  width: number;  // ✅ Requerido
  height: number; // ✅ Requerido
  state?: boolean;
}

// DTO para actualizar información básica del huerto
export interface UpdateOrchardDTO {
  name?: string;
  description?: string;
  // ❌ NO permitimos cambiar width/height si hay plantas
}

// DTO para agregar una planta al layout
export interface AddPlantToLayoutDTO {
  plantId: number;  // ✅ ID de la planta en la BD de plantas
  x: number;        // ✅ Posición X
  y: number;        // ✅ Posición Y
  width?: number;   // Opcional, default: 1
  height?: number;  // Opcional, default: 1
  rotation?: number; // Opcional, default: 0
}

// DTO para mover una planta en el layout
export interface MovePlantInLayoutDTO {
  plantInstanceId: string;  // ID de la instancia en el layout
  newX: number;
  newY: number;
}

// ===== DTOs de SALIDA =====

// DTO para representar una planta en el layout
export interface PlantInLayoutDTO {
  id: string;           // ID único de la instancia
  plantId: number;      // ID de la planta original
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  rotation: number;
  status: 'planned' | 'planted' | 'growing' | 'harvested';
  plantedAt?: Date;
}

// DTO de respuesta con información del huerto
export interface OrchardInfoDTO {
  _id: string;
  userId: string;
  name: string;
  description: string;
  width: number;
  height: number;
  area: number;
  availableArea: number;  // ✅ NUEVO: Área disponible
  plants: PlantInLayoutDTO[];  // ✅ NUEVO: Array de plantas con posiciones
  state: boolean;
  createAt: Date;
  updateAt: Date;
  timeOfLife: number;
  streakOfDays: number;
  countPlants: number;
}

// DTO de respuesta con lista de huertos
export interface OrchardListDTO {
  orchards: OrchardInfoDTO[];
  total: number;
  active: number;
  inactive: number;
}

// DTO de respuesta con estadísticas
export interface OrchardStatsDTO {
  totalOrchards: number;
  activeOrchards: number;
  inactiveOrchards: number;
  totalPlants: number;
  averagePlantsPerOrchard: number;
  totalArea: number;
  totalAvailableArea: number;  // ✅ NUEVO
}
