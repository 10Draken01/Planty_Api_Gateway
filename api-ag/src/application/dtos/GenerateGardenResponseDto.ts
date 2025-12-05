export interface PlantInLayoutDto {
  id: number;
  name: string;
  scientificName: string;
  quantity: number;
  position: { x: number; y: number };
  area: number;
  type: string[];
}

export interface SolutionDto {
  rank: number;
  layout: {
    dimensions: { width: number; height: number; totalArea: number };
    plants: PlantInLayoutDto[];
    totalPlants: number;
    usedArea: number;
    availableArea: number;
    categoryBreakdown: Record<string, number>;
  };
  metrics: {
    CEE: number;
    PSRNT: number;
    EH: number;
    UE: number;
    fitness: number;
  };
  estimations: {
    monthlyProductionKg: number;
    weeklyWaterLiters: number;
    implementationCostMXN: number;
    maintenanceMinutesPerWeek: number;
  };
  calendar: {
    currentSeason: string;
    hemisphere: 'north' | 'south';
    plantingSchedule: Array<{
      id: number;
      plant: string;
      plantingWeek: number;
      harvestWeek: number;
      daysToHarvest: number;
      notes: string;
    }>;
    monthlyTasks: Array<{
      month: string;
      week: number;
      tasks: string[];
    }>;
  };
  compatibilityMatrix: Array<{
    plant1: string;
    plant2: string;
    score: number;
    relation: 'benefica' | 'neutral' | 'perjudicial';
  }>;
}

export interface GenerateGardenResponseDto {
  success: boolean;
  solutions: SolutionDto[];
  metadata: {
    executionTimeMs: number;
    totalGenerations: number;
    convergenceGeneration: number;
    populationSize: number;
    stoppingReason: string;
    inputParameters: any;
    weightsApplied: Record<string, number>;
    selectedPlants?: Array<{ // NUEVO: plantas seleccionadas inteligentemente
      id: number;
      species: string;
      scientificName: string;
      type: string[];
    }>;
  };
}
