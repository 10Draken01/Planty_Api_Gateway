/**
 * Data Transfer Objects (DTOs) para Plants
 */

// DTO de respuesta con información de la planta
export interface PlantInfoDTO {
  _id: number;
  species: string;
  scientificName: string;
  type: string[];
  sunRequirement: 'low' | 'medium' | 'high';
  weeklyWatering: number;
  harvestDays: number;
  soilType: string;
  waterPerKg: number;
  benefits: string[];
  size: number;
}

// DTO de respuesta con lista de plantas
export interface PlantListDTO {
  plants: PlantInfoDTO[];
  total: number;
}
