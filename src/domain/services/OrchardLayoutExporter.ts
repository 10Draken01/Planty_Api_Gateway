/**
 * OrchardLayoutExporter
 *
 * Convierte los resultados del Algoritmo Genético al formato exacto
 * que espera el microservicio api-orchard para crear layouts de huertos.
 *
 * GARANTIZA COMPATIBILIDAD 100% con api-orchard
 */

import { Individual } from '../entities/Individual';

/**
 * Formato exacto que espera api-orchard para agregar una planta al layout
 */
export interface OrchardLayoutPlant {
  plantId: number;      // ID de la planta en la BD
  x: number;            // Posición X en metros
  y: number;            // Posición Y en metros
  width?: number;       // Ancho que ocupa (opcional, default basado en size)
  height?: number;      // Alto que ocupa (opcional, default basado en size)
  rotation?: number;    // Rotación en grados: 0, 90, 180, 270
}

/**
 * Payload completo para crear un huerto con layout desde el AG
 */
export interface CreateOrchardFromGAPayload {
  userId: string;
  name: string;
  description: string;
  width: number;        // Ancho del huerto en metros
  height: number;       // Alto del huerto en metros
  plants: OrchardLayoutPlant[];
}

export class OrchardLayoutExporter {
  /**
   * Exporta un Individual (solución del AG) al formato de api-orchard
   */
  static exportIndividual(
    individual: Individual,
    userId: string,
    orchardName?: string,
    description?: string
  ): CreateOrchardFromGAPayload {
    const plants: OrchardLayoutPlant[] = individual.plants.map(plantInstance => ({
      plantId: plantInstance.plant.id,
      x: plantInstance.position.x,
      y: plantInstance.position.y,
      width: plantInstance.width,
      height: plantInstance.height,
      rotation: plantInstance.rotation,
    }));

    return {
      userId,
      name: orchardName || `Huerto Optimizado ${new Date().toLocaleDateString()}`,
      description: description || this.generateDescription(individual),
      width: individual.dimensions.width,
      height: individual.dimensions.height,
      plants,
    };
  }

  /**
   * Exporta múltiples soluciones (top 3 del AG)
   */
  static exportTopSolutions(
    solutions: Individual[],
    userId: string,
    baseOrchardName?: string
  ): CreateOrchardFromGAPayload[] {
    return solutions.map((individual, index) => {
      const name = baseOrchardName
        ? `${baseOrchardName} - Opción ${index + 1}`
        : `Huerto Optimizado - Opción ${index + 1}`;

      return this.exportIndividual(individual, userId, name);
    });
  }

  /**
   * Genera solo el array de plantas en formato api-orchard
   * (útil para agregar plantas a un huerto existente)
   */
  static exportPlantsOnly(individual: Individual): OrchardLayoutPlant[] {
    return individual.plants.map(plantInstance => ({
      plantId: plantInstance.plant.id,
      x: plantInstance.position.x,
      y: plantInstance.position.y,
      width: plantInstance.width,
      height: plantInstance.height,
      rotation: plantInstance.rotation,
    }));
  }

  /**
   * Genera una descripción automática basada en las métricas del huerto
   */
  private static generateDescription(individual: Individual): string {
    const totalPlants = individual.plants.length;
    const species = new Set(individual.plants.map(p => p.plant.species)).size;
    const area = individual.dimensions.totalArea.toFixed(1);
    const fitness = (individual.fitness * 100).toFixed(1);

    const speciesList = Array.from(new Set(individual.plants.map(p => p.plant.species)))
      .slice(0, 3)
      .join(', ');

    return `Huerto optimizado con ${totalPlants} plantas de ${species} especies diferentes (${speciesList}${species > 3 ? ', ...' : ''}). Área: ${area}m². Score de optimización: ${fitness}%.`;
  }

  /**
   * Valida que el payload cumple con los requisitos de api-orchard
   */
  static validate(payload: CreateOrchardFromGAPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload.userId || payload.userId.trim().length === 0) {
      errors.push('userId es requerido');
    }

    if (!payload.name || payload.name.trim().length === 0) {
      errors.push('name es requerido');
    }

    if (payload.width <= 0 || payload.height <= 0) {
      errors.push('width y height deben ser mayores a 0');
    }

    if (!payload.plants || payload.plants.length === 0) {
      errors.push('plants no puede estar vacío');
    }

    // Validar cada planta
    payload.plants.forEach((plant, idx) => {
      if (!plant.plantId || plant.plantId <= 0) {
        errors.push(`Planta ${idx}: plantId inválido`);
      }

      if (plant.x < 0 || plant.y < 0) {
        errors.push(`Planta ${idx}: x e y deben ser no negativos`);
      }

      if (plant.x + (plant.width || 1) > payload.width) {
        errors.push(`Planta ${idx}: fuera de límites horizontal (x: ${plant.x}, width: ${plant.width})`);
      }

      if (plant.y + (plant.height || 1) > payload.height) {
        errors.push(`Planta ${idx}: fuera de límites vertical (y: ${plant.y}, height: ${plant.height})`);
      }

      if (plant.rotation !== undefined && ![0, 90, 180, 270].includes(plant.rotation)) {
        errors.push(`Planta ${idx}: rotation debe ser 0, 90, 180 o 270`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Genera un resumen legible del layout
   */
  static generateSummary(individual: Individual): string {
    const summary: string[] = [];

    summary.push('='.repeat(60));
    summary.push('RESUMEN DEL LAYOUT DE HUERTO');
    summary.push('='.repeat(60));
    summary.push('');
    summary.push(`📏 Dimensiones: ${individual.dimensions.width.toFixed(1)}m × ${individual.dimensions.height.toFixed(1)}m`);
    summary.push(`📊 Área total: ${individual.dimensions.totalArea.toFixed(1)}m²`);
    summary.push(`🌱 Total de plantas: ${individual.plants.length}`);
    summary.push(`🏆 Score de fitness: ${(individual.fitness * 100).toFixed(1)}%`);
    summary.push('');

    // Agrupar por especie
    const plantsBySpecies = new Map<string, number>();
    individual.plants.forEach(p => {
      const species = p.plant.species;
      plantsBySpecies.set(species, (plantsBySpecies.get(species) || 0) + 1);
    });

    summary.push('📋 Distribución por especie:');
    plantsBySpecies.forEach((count, species) => {
      summary.push(`   - ${species}: ${count} plantas`);
    });

    summary.push('');
    summary.push(`💧 Agua semanal: ${individual.totalWeeklyWater.toFixed(1)}L`);
    summary.push(`💰 Costo estimado: $${individual.totalCost.toFixed(2)} MXN`);
    summary.push('');

    // Métricas detalladas
    if (individual.metrics) {
      summary.push('📈 Métricas de calidad:');
      summary.push(`   - Compatibilidad (CEE): ${(individual.metrics.CEE * 100).toFixed(1)}%`);
      summary.push(`   - Balance nutricional (PSRNT): ${(individual.metrics.PSRNT * 100).toFixed(1)}%`);
      summary.push(`   - Eficiencia hídrica (EH): ${(individual.metrics.EH * 100).toFixed(1)}%`);
      summary.push(`   - Uso de espacio (UE): ${(individual.metrics.UE * 100).toFixed(1)}%`);
    }

    summary.push('');
    summary.push('='.repeat(60));

    return summary.join('\n');
  }
}
