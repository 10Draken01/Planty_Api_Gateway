import { PlantInstance } from './PlantInstance';
import { Dimensions } from '../value-objects/Dimensions';
import { Metrics } from '../value-objects/Metrics';

/**
 * Individuo del Algoritmo Genético.
 * Representa una configuración de huerto (layout) con su fitness.
 */
export class Individual {
  public readonly dimensions: Dimensions;
  public readonly plants: PlantInstance[];
  public metrics?: Metrics;

  // Genoma: matriz de IDs de plantas
  public readonly genome: (number | null)[][];

  constructor(
    dimensions: Dimensions,
    genome: (number | null)[][],
    plants: PlantInstance[] = []
  ) {
    this.dimensions = dimensions;
    this.genome = genome;
    this.plants = plants;
  }

  get fitness(): number {
    return this.metrics?.fitness ?? 0;
  }

  get totalPlants(): number {
    return this.plants.reduce((sum, p) => sum + p.quantity, 0);
  }

  get usedArea(): number {
    return this.plants.reduce((sum, p) => sum + p.totalArea, 0);
  }

  get availableArea(): number {
    return this.dimensions.totalArea - this.usedArea;
  }

  get totalWeeklyWater(): number {
    return this.plants.reduce((sum, p) => sum + p.totalWeeklyWater, 0);
  }

  get totalCost(): number {
    return this.plants.reduce((sum, p) => sum + p.totalCost, 0);
  }

  /**
   * Clona el individuo (deep copy)
   */
  clone(): Individual {
    const genomeClone = this.genome.map(row => [...row]);
    const plantsClone = [...this.plants];
    const individual = new Individual(this.dimensions, genomeClone, plantsClone);
    individual.metrics = this.metrics;
    return individual;
  }

  toJSON() {
    return {
      dimensions: this.dimensions.toJSON(),
      plants: this.plants.map(p => p.toJSON()),
      metrics: this.metrics?.toJSON(),
      totalPlants: this.totalPlants,
      usedArea: this.usedArea,
      availableArea: this.availableArea,
    };
  }
}
