/**
 * Data Transfer Objects (DTOs) para Orchards
 */

// DTO para crear un nuevo huerto
export interface CreateOrchardDTO {
  userId: string;
  name: string;
  description: string;
  plants_id?: string[];
  width: number;
  height: number;
  state?: boolean;
}

// DTO para actualizar un huerto
export interface UpdateOrchardDTO {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
}

// DTO para agregar una planta al huerto
export interface AddPlantDTO {
  plantId: string;
}

// DTO de respuesta con información del huerto
export interface OrchardInfoDTO {
  _id: string;
  userId: string;
  name: string;
  description: string;
  plants_id: string[];
  width: number;
  height: number;
  area: number;
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
}
