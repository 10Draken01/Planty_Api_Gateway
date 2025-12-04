import { Individual } from '../entities/Individual';
import { Plant } from '../entities/Plant';
import { Metrics, MetricsData } from '../value-objects/Metrics';
import { Position } from '../value-objects/Position';
import { CategoryDistribution } from '../value-objects/CategoryDistribution';

export type Objective = 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';

/**
 * Pesos dinámicos según objetivo del huerto.
 * Basado en especificación LaTeX Capítulo 3.
 */
const OBJECTIVE_WEIGHTS: Record<Objective, { CEE: number; PSRNT: number; EH: number; UE: number }> = {
  alimenticio: { CEE: 0.20, PSRNT: 0.50, EH: 0.20, UE: 0.10 },
  medicinal: { CEE: 0.25, PSRNT: 0.45, EH: 0.15, UE: 0.15 },
  sostenible: { CEE: 0.25, PSRNT: 0.20, EH: 0.40, UE: 0.15 },
  ornamental: { CEE: 0.20, PSRNT: 0.40, EH: 0.15, UE: 0.25 },
};

export interface FitnessCalculatorConfig {
  compatibilityMatrix: Map<string, Map<string, number>>;
  objective: Objective;
  desiredCategoryDistribution?: CategoryDistribution;
  maxWaterWeekly: number;
}

export class FitnessCalculatorService {
  constructor(private config: FitnessCalculatorConfig) {}

  /**
   * Calcula el fitness completo de un individuo.
   * Evalúa las 4 métricas: CEE, PSRNT, EH, UE.
   */
  calculate(individual: Individual): Metrics {
    const CEE = this.calculateCEE(individual);
    const PSRNT = this.calculatePSRNT(individual);
    const EH = this.calculateEH(individual);
    const UE = this.calculateUE(individual);

    const weights = OBJECTIVE_WEIGHTS[this.config.objective];

    return new Metrics({ CEE, PSRNT, EH, UE }, weights);
  }

  /**
   * CEE: Compatibilidad Entre Especies.
   * Fórmula: Suma ponderada de compatibilidades entre plantas adyacentes.
   * Peso = 1 / (distancia + 1) para dar más peso a plantas cercanas.
   */
  private calculateCEE(individual: Individual): number {
    if (individual.plants.length < 2) {
      return 1.0; // Un solo tipo de planta es compatible consigo misma
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < individual.plants.length; i++) {
      for (let j = i + 1; j < individual.plants.length; j++) {
        const plant1 = individual.plants[i];
        const plant2 = individual.plants[j];

        const distance = plant1.position.distanceTo(plant2.position);
        const weight = 1 / (distance + 1); // Peso inversamente proporcional a distancia

        const compatibility = this.getCompatibilityScore(
          plant1.plant.species,
          plant2.plant.species
        );

        totalWeightedScore += compatibility * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 1.0;
    }

    // Normalizar de [-1, 1] a [0, 1]
    const averageScore = totalWeightedScore / totalWeight;
    return (averageScore + 1) / 2;
  }

  /**
   * PSRNT: Satisfacción de Rendimiento Nutricional/Terapéutico.
   * Mide qué tan bien se alinea la distribución de categorías con lo deseado.
   */
  private calculatePSRNT(individual: Individual): number {
    if (!this.config.desiredCategoryDistribution) {
      return 1.0; // Si no hay distribución deseada, máxima satisfacción
    }

    const actual = this.calculateCategoryDistribution(individual);
    const desired = this.config.desiredCategoryDistribution;

    // Calcular error cuadrático medio normalizado
    const errors = [
      Math.pow(actual.vegetable - desired.vegetable, 2),
      Math.pow(actual.medicinal - desired.medicinal, 2),
      Math.pow(actual.aromatic - desired.aromatic, 2),
      Math.pow(actual.ornamental - desired.ornamental, 2),
    ];

    const mse = errors.reduce((sum, e) => sum + e, 0) / 4;
    const maxError = 100 * 100; // Máximo error posible (100% de diferencia)

    // Convertir error a satisfacción [0, 1]
    return 1 - Math.sqrt(mse) / 100;
  }

  /**
   * EH: Eficiencia Hídrica.
   * Fórmula: 1 - (agua_usada / agua_max)
   * Maximiza el uso del agua disponible sin exceder el límite.
   */
  private calculateEH(individual: Individual): number {
    const waterUsed = individual.totalWeeklyWater;
    const waterMax = this.config.maxWaterWeekly;

    if (waterMax === 0) {
      return 1.0;
    }

    // Si excede el agua, penalizar fuertemente
    if (waterUsed > waterMax) {
      const excess = waterUsed - waterMax;
      return Math.max(0, 1 - (excess / waterMax) - 0.5);
    }

    // Ideal: usar entre 80-100% del agua disponible
    const usage = waterUsed / waterMax;

    if (usage >= 0.8 && usage <= 1.0) {
      return 1.0;
    } else if (usage < 0.8) {
      return usage / 0.8; // Penalizar subutilización
    }

    return 1.0;
  }

  /**
   * UE: Utilización de Espacio.
   * Fórmula: área_usada / área_total (máximo 0.85 para evitar sobresaturación)
   */
  private calculateUE(individual: Individual): number {
    const usedArea = individual.usedArea;
    const totalArea = individual.dimensions.totalArea;

    if (totalArea === 0) {
      return 0;
    }

    const usage = usedArea / totalArea;

    // Penalizar si excede 0.85 (sobresaturación)
    if (usage > 0.85) {
      return Math.max(0, 1 - (usage - 0.85) * 5);
    }

    // Normalizar al rango [0, 1] con óptimo en 0.85
    return usage / 0.85;
  }

  /**
   * Obtiene el score de compatibilidad entre dos plantas.
   */
  private getCompatibilityScore(species1: string, species2: string): number {
    const score1 = this.config.compatibilityMatrix.get(species1)?.get(species2);
    if (score1 !== undefined) {
      return score1;
    }

    // Intentar orden inverso
    const score2 = this.config.compatibilityMatrix.get(species2)?.get(species1);
    if (score2 !== undefined) {
      return score2;
    }

    // Si no existe, asumir neutral
    return 0;
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
