import { Individual } from '../entities/Individual';
import { Plant } from '../entities/Plant';
import { Metrics, MetricsData } from '../value-objects/Metrics';
import { Position } from '../value-objects/Position';
import { CategoryDistribution } from '../value-objects/CategoryDistribution';

export type Objective = 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';

/**
 * Pesos dinámicos MEJORADOS según objetivo del huerto.
 *
 * NUEVAS MÉTRICAS:
 * - CEE: Compatibilidad Entre Especies (con penalización por vecindad)
 * - PSRNT: Satisfacción de Rendimiento Nutricional/Terapéutico
 * - EH: Eficiencia Hídrica
 * - UE: Utilización de Espacio
 * - CS: Ciclos Sincronizados (NUEVO)
 * - BSN: Balance de Suelo y Nutrientes (NUEVO)
 */
const OBJECTIVE_WEIGHTS: Record<
  Objective,
  { CEE: number; PSRNT: number; EH: number; UE: number; CS: number; BSN: number }
> = {
  alimenticio: { CEE: 0.15, PSRNT: 0.40, EH: 0.15, UE: 0.10, CS: 0.10, BSN: 0.10 },
  medicinal: { CEE: 0.20, PSRNT: 0.35, EH: 0.10, UE: 0.10, CS: 0.10, BSN: 0.15 },
  sostenible: { CEE: 0.20, PSRNT: 0.15, EH: 0.30, UE: 0.10, CS: 0.10, BSN: 0.15 },
  ornamental: { CEE: 0.15, PSRNT: 0.30, EH: 0.10, UE: 0.20, CS: 0.10, BSN: 0.15 },
};

export interface ImprovedFitnessConfig {
  compatibilityMatrix: Map<string, Map<string, number>>;
  objective: Objective;
  desiredCategoryDistribution?: CategoryDistribution;
  maxWaterWeekly: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export class ImprovedFitnessCalculator {
  constructor(private config: ImprovedFitnessConfig) {}

  /**
   * Calcula el fitness completo de un individuo.
   * Evalúa 6 métricas: CEE, PSRNT, EH, UE, CS, BSN.
   */
  calculate(individual: Individual): Metrics {
    const CEE = this.calculateCEE(individual);
    const PSRNT = this.calculatePSRNT(individual);
    const EH = this.calculateEH(individual);
    const UE = this.calculateUE(individual);
    const CS = this.calculateCS(individual);
    const BSN = this.calculateBSN(individual);

    const weights = OBJECTIVE_WEIGHTS[this.config.objective];

    // Calcular fitness ponderado
    const fitness =
      CEE * weights.CEE +
      PSRNT * weights.PSRNT +
      EH * weights.EH +
      UE * weights.UE +
      CS * weights.CS +
      BSN * weights.BSN;

    return new Metrics({ CEE, PSRNT, EH, UE }, weights, fitness);
  }

  /**
   * CEE: Compatibilidad Entre Especies (MEJORADO).
   *
   * MEJORAS:
   * 1. Penalización exponencial por incompatibilidad en vecindad directa
   * 2. Bonificación por parejas beneficiosas adyacentes
   * 3. Peso basado en distancia euclidiana real
   */
  private calculateCEE(individual: Individual): number {
    if (individual.plants.length < 2) {
      return 1.0;
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < individual.plants.length; i++) {
      for (let j = i + 1; j < individual.plants.length; j++) {
        const plant1 = individual.plants[i];
        const plant2 = individual.plants[j];

        const distance = plant1.position.distanceTo(plant2.position);

        // Peso exponencial inverso: plantas cercanas tienen mucho más impacto
        const weight = Math.exp(-distance / 2);

        const compatibility = this.getCompatibilityScore(
          plant1.plant.species,
          plant2.plant.species
        );

        // Penalización severa por incompatibilidad cercana
        if (compatibility < -0.5 && distance < 1.5) {
          totalScore += compatibility * weight * 2; // Doble penalización
        } else if (compatibility > 0.5 && distance < 1.0) {
          totalScore += compatibility * weight * 1.5; // Bonificación por sinergia cercana
        } else {
          totalScore += compatibility * weight;
        }

        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 1.0;
    }

    // Normalizar de [-1, 1] a [0, 1]
    const averageScore = totalScore / totalWeight;
    return Math.max(0, Math.min(1, (averageScore + 1) / 2));
  }

  /**
   * PSRNT: Satisfacción de Rendimiento Nutricional/Terapéutico (MEJORADO).
   *
   * MEJORAS:
   * 1. Penalización cuadrática por desviación
   * 2. Bonificación por diversidad balanceada
   */
  private calculatePSRNT(individual: Individual): number {
    if (!this.config.desiredCategoryDistribution) {
      // Sin distribución deseada: premiar diversidad
      return this.calculateDiversityBonus(individual);
    }

    const actual = this.calculateCategoryDistribution(individual);
    const desired = this.config.desiredCategoryDistribution;

    // Error cuadrático medio
    const errors = [
      Math.pow(actual.vegetable - desired.vegetable, 2),
      Math.pow(actual.medicinal - desired.medicinal, 2),
      Math.pow(actual.aromatic - desired.aromatic, 2),
      Math.pow(actual.ornamental - desired.ornamental, 2),
    ];

    const mse = errors.reduce((sum, e) => sum + e, 0) / 4;

    // Convertir error a satisfacción [0, 1]
    return Math.max(0, 1 - Math.sqrt(mse) / 100);
  }

  /**
   * EH: Eficiencia Hídrica (MEJORADO).
   *
   * MEJORAS:
   * 1. Curva de eficiencia realista (óptimo 80-95%)
   * 2. Penalización progresiva por exceso
   */
  private calculateEH(individual: Individual): number {
    const waterUsed = individual.totalWeeklyWater;
    const waterMax = this.config.maxWaterWeekly;

    if (waterMax === 0) {
      return 1.0;
    }

    const usage = waterUsed / waterMax;

    // Penalización severa por exceso
    if (usage > 1.0) {
      const excess = usage - 1.0;
      return Math.max(0, 1 - excess * 2);
    }

    // Curva de eficiencia óptima: 80-95%
    if (usage >= 0.8 && usage <= 0.95) {
      return 1.0;
    } else if (usage < 0.8) {
      return usage / 0.8; // Penalizar subutilización
    } else {
      // 0.95 < usage <= 1.0
      return 1 - (usage - 0.95) * 2;
    }
  }

  /**
   * UE: Utilización de Espacio (MEJORADO).
   *
   * MEJORAS:
   * 1. Óptimo realista: 70-85%
   * 2. Penalización por sobresaturación
   */
  private calculateUE(individual: Individual): number {
    const usedArea = individual.usedArea;
    const totalArea = individual.dimensions.totalArea;

    if (totalArea === 0) {
      return 0;
    }

    const usage = usedArea / totalArea;

    // Óptimo: 70-85%
    if (usage >= 0.7 && usage <= 0.85) {
      return 1.0;
    } else if (usage < 0.7) {
      return usage / 0.7;
    } else {
      // Penalización severa por sobresaturación
      return Math.max(0, 1 - (usage - 0.85) * 3);
    }
  }

  /**
   * CS: Ciclos Sincronizados (NUEVO).
   *
   * Premia huertos donde las plantas tienen ciclos de cosecha similares.
   * Facilita rotación y mantenimiento.
   */
  private calculateCS(individual: Individual): number {
    if (individual.plants.length < 2) {
      return 1.0;
    }

    const harvestDays = individual.plants.map(p => p.plant.harvestDays);
    const avgHarvest = harvestDays.reduce((sum, d) => sum + d, 0) / harvestDays.length;

    // Calcular desviación estándar
    const variance =
      harvestDays.reduce((sum, d) => sum + Math.pow(d - avgHarvest, 2), 0) /
      harvestDays.length;
    const stdDev = Math.sqrt(variance);

    // Normalizar: stdDev bajo = alta sincronización
    // Máxima desviación esperada: ~60 días
    const score = Math.max(0, 1 - stdDev / 60);

    return score;
  }

  /**
   * BSN: Balance de Suelo y Nutrientes (NUEVO).
   *
   * Evalúa diversidad de tipos de suelo requeridos.
   * Huertos balanceados tienen variedad pero no exceso.
   */
  private calculateBSN(individual: Individual): number {
    const soilTypes = new Set(individual.plants.map(p => p.plant.soilType));
    const uniqueSoilCount = soilTypes.size;

    // Óptimo: 2-3 tipos de suelo diferentes
    if (uniqueSoilCount >= 2 && uniqueSoilCount <= 3) {
      return 1.0;
    } else if (uniqueSoilCount === 1) {
      return 0.6; // Penalizar monocultura
    } else {
      // Más de 3 tipos: complejidad excesiva
      return Math.max(0.4, 1 - (uniqueSoilCount - 3) * 0.2);
    }
  }

  /**
   * Bonificación por diversidad balanceada
   */
  private calculateDiversityBonus(individual: Individual): number {
    const dist = this.calculateCategoryDistribution(individual);
    const values = [dist.vegetable, dist.medicinal, dist.aromatic, dist.ornamental];

    // Calcular entropía de Shannon normalizada
    const entropy = values
      .filter(v => v > 0)
      .reduce((sum, v) => {
        const p = v / 100;
        return sum - p * Math.log2(p);
      }, 0);

    const maxEntropy = Math.log2(4); // Máxima entropía con 4 categorías
    return entropy / maxEntropy;
  }

  /**
   * Obtiene el score de compatibilidad entre dos plantas.
   */
  private getCompatibilityScore(species1: string, species2: string): number {
    const score1 = this.config.compatibilityMatrix.get(species1)?.get(species2);
    if (score1 !== undefined) {
      return score1;
    }

    const score2 = this.config.compatibilityMatrix.get(species2)?.get(species1);
    if (score2 !== undefined) {
      return score2;
    }

    return 0; // Neutral
  }

  /**
   * Calcula la distribución de categorías del individuo.
   */
  private calculateCategoryDistribution(individual: Individual): CategoryDistribution {
    const counts = {
      vegetable: 0,
      medicinal: 0,
      aromatic: 0,
      ornamental: 0,
    };

    individual.plants.forEach(plantInstance => {
      plantInstance.plant.type.forEach(type => {
        if (type in counts) {
          (counts as any)[type] += plantInstance.quantity;
        }
      });
    });

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return new CategoryDistribution({ vegetable: 25, medicinal: 25, aromatic: 25, ornamental: 25 });
    }

    return new CategoryDistribution({
      vegetable: (counts.vegetable / total) * 100,
      medicinal: (counts.medicinal / total) * 100,
      aromatic: (counts.aromatic / total) * 100,
      ornamental: (counts.ornamental / total) * 100,
    });
  }

  getWeights() {
    return OBJECTIVE_WEIGHTS[this.config.objective];
  }
}
