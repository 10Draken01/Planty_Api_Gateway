import { Individual } from '../entities/Individual';
import { Plant } from '../entities/Plant';

export interface ValidationResult {
  isValid: boolean;
  passed: string[];
  failed: string[];
  errors: string[];
}

export interface ValidationConstraints {
  maxArea: number;
  maxWaterWeekly: number;
  maxBudget?: number;
  userExperience: 1 | 2 | 3; // 1=principiante, 2=intermedio, 3=experto
  availableMaintenanceMinutes?: number;
}

/**
 * Servicio de validación de configuraciones de huertos.
 * Implementa las 5 validaciones requeridas: Botánica, Física, Técnica, Económica, Agrícola.
 */
export class ValidationService {
  private plants: Plant[];
  private compatibilityMatrix: Map<string, Map<string, number>>;

  constructor(plants: Plant[], compatibilityMatrix: Map<string, Map<string, number>>) {
    this.plants = plants;
    this.compatibilityMatrix = compatibilityMatrix;
  }

  /**
   * Valida un individuo contra todas las restricciones.
   */
  validate(individual: Individual, constraints: ValidationConstraints): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      passed: [],
      failed: [],
      errors: [],
    };

    // 1. Validación Botánica
    const botanicalValidation = this.validateBotanical(individual);
    if (botanicalValidation.isValid) {
      result.passed.push('BOTÁNICA');
    } else {
      result.failed.push('BOTÁNICA');
      result.errors.push(...botanicalValidation.errors);
      result.isValid = false;
    }

    // 2. Validación Física
    const physicalValidation = this.validatePhysical(individual, constraints);
    if (physicalValidation.isValid) {
      result.passed.push('FÍSICA');
    } else {
      result.failed.push('FÍSICA');
      result.errors.push(...physicalValidation.errors);
      result.isValid = false;
    }

    // 3. Validación Técnica
    const technicalValidation = this.validateTechnical(individual, constraints);
    if (technicalValidation.isValid) {
      result.passed.push('TÉCNICA');
    } else {
      result.failed.push('TÉCNICA');
      result.errors.push(...technicalValidation.errors);
      result.isValid = false;
    }

    // 4. Validación Económica
    const economicValidation = this.validateEconomic(individual, constraints);
    if (economicValidation.isValid) {
      result.passed.push('ECONÓMICA');
    } else {
      result.failed.push('ECONÓMICA');
      result.errors.push(...economicValidation.errors);
      result.isValid = false;
    }

    // 5. Validación Agrícola
    const agriculturalValidation = this.validateAgricultural(individual);
    if (agriculturalValidation.isValid) {
      result.passed.push('AGRÍCOLA');
    } else {
      result.failed.push('AGRÍCOLA');
      result.errors.push(...agriculturalValidation.errors);
      result.isValid = false;
    }

    return result;
  }

  /**
   * 1. VALIDACIÓN BOTÁNICA:
   * - Todas las plantas existen en la BD
   * - Son compatibles con clima tropical (Af - Chiapas)
   */
  private validateBotanical(individual: Individual): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const plantInstance of individual.plants) {
      const plantId = plantInstance.plant.id;
      const exists = this.plants.some(p => p.id === plantId);

      if (!exists) {
        errors.push(`Planta con ID ${plantId} no existe en la base de datos`);
      }

      // Todas las plantas en la BD son compatibles con clima Af (tropical)
      // Esta validación está implícita en la carga de datos
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 2. VALIDACIÓN FÍSICA:
   * - Área ocupada ≤ área disponible
   * - Utilización de espacio UE ≤ 0.85 (evitar sobresaturación)
   */
  private validatePhysical(
    individual: Individual,
    constraints: ValidationConstraints
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar área
    if (individual.usedArea > constraints.maxArea) {
      errors.push(
        `Área ocupada (${individual.usedArea.toFixed(2)} m²) excede área disponible (${constraints.maxArea} m²)`
      );
    }

    // Verificar utilización de espacio
    const usage = individual.usedArea / individual.dimensions.totalArea;
    if (usage > 0.85) {
      errors.push(`Utilización de espacio (${(usage * 100).toFixed(1)}%) excede el máximo recomendado (85%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 3. VALIDACIÓN TÉCNICA:
   * - Tiempo de mantenimiento ≤ tiempo disponible según experiencia
   * Estimación: principiante 60 min/semana, intermedio 120 min, experto 180 min
   */
  private validateTechnical(
    individual: Individual,
    constraints: ValidationConstraints
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Estimar minutos de mantenimiento por planta
    const maintenancePerPlant = 15; // 15 minutos por planta a la semana
    const estimatedMaintenance = individual.totalPlants * maintenancePerPlant;

    // Tiempo disponible según experiencia
    const defaultMaintenanceTime = {
      1: 60,   // Principiante
      2: 120,  // Intermedio
      3: 180,  // Experto
    };

    const availableTime =
      constraints.availableMaintenanceMinutes ?? defaultMaintenanceTime[constraints.userExperience];

    if (estimatedMaintenance > availableTime) {
      errors.push(
        `Tiempo de mantenimiento estimado (${estimatedMaintenance} min/semana) excede tiempo disponible (${availableTime} min/semana)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 4. VALIDACIÓN ECONÓMICA:
   * - Costo estimado ≤ presupuesto (si se especificó)
   * Costo = suma de (área_planta * 50 MXN/m²)
   */
  private validateEconomic(
    individual: Individual,
    constraints: ValidationConstraints
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Si no hay presupuesto definido, la validación pasa
    if (!constraints.maxBudget) {
      return { isValid: true, errors: [] };
    }

    const totalCost = individual.totalCost;

    if (totalCost > constraints.maxBudget) {
      errors.push(
        `Costo estimado ($${totalCost.toFixed(2)} MXN) excede presupuesto ($${constraints.maxBudget} MXN)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 5. VALIDACIÓN AGRÍCOLA:
   * - No existen compatibilidades críticas (< -0.5) entre plantas adyacentes
   * Adyacente = distancia < 1.0 metro
   */
  private validateAgricultural(individual: Individual): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < individual.plants.length; i++) {
      for (let j = i + 1; j < individual.plants.length; j++) {
        const plant1 = individual.plants[i];
        const plant2 = individual.plants[j];

        const distance = plant1.position.distanceTo(plant2.position);

        // Solo verificar plantas adyacentes (< 1 metro)
        if (distance < 1.0) {
          const compatibility = this.getCompatibilityScore(
            plant1.plant.species,
            plant2.plant.species
          );

          if (compatibility < -0.5) {
            errors.push(
              `Incompatibilidad crítica entre ${plant1.plant.species} y ${plant2.plant.species} (score: ${compatibility.toFixed(2)})`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private getCompatibilityScore(species1: string, species2: string): number {
    const score1 = this.compatibilityMatrix.get(species1)?.get(species2);
    if (score1 !== undefined) return score1;

    const score2 = this.compatibilityMatrix.get(species2)?.get(species1);
    if (score2 !== undefined) return score2;

    return 0; // Neutral si no existe
  }
}
