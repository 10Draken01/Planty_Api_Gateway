/**
 * PlantSpacingService
 *
 * Calcula espaciamiento dinámico entre plantas basado en:
 * 1. Compatibilidad entre especies
 * 2. Tamaño de las plantas
 * 3. Requisitos de crecimiento
 */

import { Plant } from '../entities/Plant';

export interface SpacingConfig {
  compatibilityMatrix?: Map<string, Map<string, number>>;
}

export class PlantSpacingService {
  private compatibilityMatrix: Map<string, Map<string, number>>;

  constructor(config?: SpacingConfig) {
    this.compatibilityMatrix = config?.compatibilityMatrix || new Map();
  }

  /**
   * Calcula la distancia mínima requerida entre dos plantas
   *
   * Estrategia:
   * - Plantas incompatibles (< -0.5): 2.5m mínimo
   * - Plantas neutras (-0.5 a 0.5): 1.5m mínimo
   * - Plantas compatibles (> 0.5): 1.0m mínimo
   * - Se suma el radio de ambas plantas para evitar solapamiento
   */
  calculateMinimumDistance(plant1: Plant, plant2: Plant): number {
    const compatibilityScore = this.getCompatibilityScore(plant1.species, plant2.species);

    // Distancia base según compatibilidad
    let baseDistance: number;
    if (compatibilityScore < -0.5) {
      baseDistance = 2.5; // Incompatibles: mantener distancia
    } else if (compatibilityScore > 0.5) {
      baseDistance = 1.0; // Compatibles: pueden estar cerca
    } else {
      baseDistance = 1.5; // Neutras: distancia moderada
    }

    // Agregar el radio de ambas plantas para evitar solapamiento físico
    const radius1 = Math.sqrt(plant1.size) / 2;
    const radius2 = Math.sqrt(plant2.size) / 2;

    return baseDistance + radius1 + radius2;
  }

  /**
   * Calcula el espacio de buffer alrededor de una planta
   * (usado para plantas con efectos especiales como repelentes)
   */
  calculateBufferZone(plant: Plant): number {
    // Plantas aromáticas suelen tener efecto repelente
    if (plant.isAromatic()) {
      return 0.5; // 50cm de zona de influencia
    }

    // Plantas grandes necesitan más espacio
    if (plant.size > 2.0) {
      return 0.3;
    }

    return 0.2; // Buffer mínimo default
  }

  /**
   * Verifica si dos plantas pueden estar adyacentes dado su espaciamiento
   */
  canBeAdjacent(plant1: Plant, plant2: Plant, actualDistance: number): boolean {
    const minimumDistance = this.calculateMinimumDistance(plant1, plant2);
    return actualDistance >= minimumDistance;
  }

  /**
   * Obtiene el score de compatibilidad entre dos especies
   */
  private getCompatibilityScore(species1: string, species2: string): number {
    const species1Map = this.compatibilityMatrix.get(species1);
    if (!species1Map) return 0;

    return species1Map.get(species2) ?? 0;
  }

  /**
   * Calcula posiciones sugeridas alrededor de una planta central
   * considerando compatibilidad y espaciamiento
   */
  suggestPositionsAround(
    centralPlant: Plant,
    centralX: number,
    centralY: number,
    neighborPlant: Plant,
    numPositions: number = 8
  ): Array<{ x: number; y: number }> {
    const minDistance = this.calculateMinimumDistance(centralPlant, neighborPlant);
    const positions: Array<{ x: number; y: number }> = [];

    // Generar posiciones en círculo alrededor de la planta central
    for (let i = 0; i < numPositions; i++) {
      const angle = (2 * Math.PI * i) / numPositions;
      const x = centralX + minDistance * Math.cos(angle);
      const y = centralY + minDistance * Math.sin(angle);
      positions.push({ x, y });
    }

    return positions;
  }

  /**
   * Calcula un factor de penalización por proximidad excesiva
   * Usado en el fitness del AG
   */
  calculateProximityPenalty(plant1: Plant, plant2: Plant, actualDistance: number): number {
    const minimumDistance = this.calculateMinimumDistance(plant1, plant2);

    if (actualDistance >= minimumDistance) {
      return 0; // Sin penalización
    }

    // Penalización exponencial por estar muy cerca
    const ratio = actualDistance / minimumDistance;
    return Math.pow(1 - ratio, 2); // Penalización cuadrática
  }
}
