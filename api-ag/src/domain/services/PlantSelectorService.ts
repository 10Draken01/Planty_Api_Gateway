import { Plant } from '../entities/Plant';
import { Objective } from './FitnessCalculatorService';

export interface PlantSelectionConfig {
  desiredPlantSpecies?: string[]; // Lista de especies deseadas por el usuario
  maxSpecies: number; // Máximo de especies simultáneas (3 o 5)
  objective: Objective; // Objetivo del huerto
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'auto';
  compatibilityMatrix: Map<string, Map<string, number>>;
}

export interface PlantScore {
  plant: Plant;
  score: number;
  reasons: string[];
}

/**
 * Servicio para selección inteligente de plantas.
 *
 * ESTRATEGIAS:
 * 1. Filtrar por lista del usuario si está disponible
 * 2. Priorizar por objetivo (alimenticio, medicinal, sostenible, ornamental)
 * 3. Evaluar compatibilidad mutua entre candidatas
 * 4. Balancear nutrientes del suelo
 * 5. Sincronizar ciclos de crecimiento
 * 6. Considerar estacionalidad
 */
export class PlantSelectorService {
  constructor(private config: PlantSelectionConfig) {}

  /**
   * Selecciona las mejores N plantas para el huerto.
   */
  selectBestPlants(allPlants: Plant[]): Plant[] {
    // PASO 1: Filtrar por lista del usuario
    let candidates = this.filterByUserPreferences(allPlants);

    // PASO 2: Filtrar por estacionalidad
    candidates = this.filterBySeason(candidates);

    // Si hay muy pocas candidatas, relajar restricciones
    if (candidates.length < this.config.maxSpecies) {
      candidates = allPlants;
    }

    // PASO 3: Calcular scores para cada planta
    const scored = candidates.map(plant => this.scorePlant(plant, candidates));

    // PASO 4: Ordenar por score descendente
    scored.sort((a, b) => b.score - a.score);

    // PASO 5: Selección iterativa considerando compatibilidad
    return this.greedySelection(scored);
  }

  /**
   * Filtra plantas según preferencias del usuario
   */
  private filterByUserPreferences(plants: Plant[]): Plant[] {
    if (!this.config.desiredPlantSpecies || this.config.desiredPlantSpecies.length === 0) {
      return plants; // Sin restricción
    }

    const desiredSet = new Set(
      this.config.desiredPlantSpecies.map(s => s.toLowerCase().trim())
    );

    return plants.filter(
      plant =>
        desiredSet.has(plant.species.toLowerCase()) ||
        desiredSet.has(plant.scientificName.toLowerCase())
    );
  }

  /**
   * Filtra plantas según estación
   */
  private filterBySeason(plants: Plant[]): Plant[] {
    if (!this.config.season || this.config.season === 'auto') {
      return plants; // Sin filtro estacional
    }

    // TODO: Implementar lógica real de estacionalidad basada en harvestDays
    // Por ahora, retorna todas
    return plants;
  }

  /**
   * Calcula score de una planta individual
   */
  private scorePlant(plant: Plant, context: Plant[]): PlantScore {
    let score = 0;
    const reasons: string[] = [];

    // CRITERIO 1: Alineación con objetivo (peso: 30%)
    const objectiveScore = this.scoreByObjective(plant);
    score += objectiveScore * 0.3;
    if (objectiveScore > 0.7) {
      reasons.push(`Alineada con objetivo ${this.config.objective}`);
    }

    // CRITERIO 2: Compatibilidad promedio con otras candidatas (peso: 40%)
    const compatScore = this.scoreByCompatibility(plant, context);
    score += compatScore * 0.4;
    if (compatScore > 0.6) {
      reasons.push('Alta compatibilidad con otras plantas');
    }

    // CRITERIO 3: Eficiencia de recursos (peso: 20%)
    const resourceScore = this.scoreByResourceEfficiency(plant);
    score += resourceScore * 0.2;
    if (resourceScore > 0.7) {
      reasons.push('Eficiente en recursos');
    }

    // CRITERIO 4: Diversidad nutricional (peso: 10%)
    const diversityScore = this.scoreByNutritionalDiversity(plant);
    score += diversityScore * 0.1;

    return { plant, score, reasons };
  }

  /**
   * Score por alineación con objetivo
   */
  private scoreByObjective(plant: Plant): number {
    switch (this.config.objective) {
      case 'alimenticio':
        return plant.hasType('vegetable') ? 1.0 : 0.3;

      case 'medicinal':
        return plant.hasType('medicinal') ? 1.0 : plant.hasType('aromatic') ? 0.6 : 0.2;

      case 'sostenible':
        // Priorizar plantas de bajo consumo de agua
        const waterEfficiency = Math.max(0, 1 - plant.weeklyWatering / 100);
        return waterEfficiency;

      case 'ornamental':
        return plant.hasType('ornamental') ? 1.0 : plant.hasType('aromatic') ? 0.5 : 0.2;

      default:
        return 0.5;
    }
  }

  /**
   * Score por compatibilidad con otras plantas
   */
  private scoreByCompatibility(plant: Plant, others: Plant[]): number {
    if (others.length <= 1) {
      return 1.0; // Sin contexto, score neutro
    }

    let totalCompatibility = 0;
    let count = 0;

    for (const other of others) {
      if (other.species === plant.species) continue;

      const compat = this.getCompatibility(plant.species, other.species);
      totalCompatibility += compat;
      count++;
    }

    if (count === 0) return 1.0;

    // Normalizar de [-1, 1] a [0, 1]
    const avgCompat = totalCompatibility / count;
    return (avgCompat + 1) / 2;
  }

  /**
   * Obtiene compatibilidad entre dos especies
   */
  private getCompatibility(species1: string, species2: string): number {
    const score1 = this.config.compatibilityMatrix.get(species1)?.get(species2);
    if (score1 !== undefined) return score1;

    const score2 = this.config.compatibilityMatrix.get(species2)?.get(species1);
    if (score2 !== undefined) return score2;

    return 0; // Neutral si no hay datos
  }

  /**
   * Score por eficiencia de recursos
   */
  private scoreByResourceEfficiency(plant: Plant): number {
    // Plantas pequeñas y de bajo riego son más eficientes
    const sizeScore = Math.max(0, 1 - plant.size / 2); // Normalizar tamaño
    const waterScore = Math.max(0, 1 - plant.weeklyWatering / 100);

    return (sizeScore + waterScore) / 2;
  }

  /**
   * Score por diversidad nutricional
   */
  private scoreByNutritionalDiversity(plant: Plant): number {
    // Plantas que pertenecen a múltiples categorías son más valiosas
    const typeCount = plant.type.length;
    return Math.min(1, typeCount / 3);
  }

  /**
   * Selección codiciosa iterativa considerando compatibilidad
   */
  private greedySelection(scored: PlantScore[]): Plant[] {
    const selected: Plant[] = [];
    const maxSpecies = this.config.maxSpecies;

    for (const candidate of scored) {
      if (selected.length >= maxSpecies) break;

      // Verificar compatibilidad con ya seleccionadas
      const isCompatible = this.checkCompatibilityWithSelected(candidate.plant, selected);

      if (isCompatible) {
        selected.push(candidate.plant);
      }
    }

    // Si no se alcanzó el máximo, agregar las mejor rankeadas sin importar compatibilidad
    if (selected.length < maxSpecies) {
      for (const candidate of scored) {
        if (selected.length >= maxSpecies) break;
        if (!selected.includes(candidate.plant)) {
          selected.push(candidate.plant);
        }
      }
    }

    return selected;
  }

  /**
   * Verifica que una planta sea compatible con las ya seleccionadas
   */
  private checkCompatibilityWithSelected(plant: Plant, selected: Plant[]): boolean {
    if (selected.length === 0) return true;

    let negativeCount = 0;

    for (const other of selected) {
      const compat = this.getCompatibility(plant.species, other.species);
      if (compat < -0.3) {
        // Compatibilidad muy negativa
        negativeCount++;
      }
    }

    // Rechazar si tiene más de 1 incompatibilidad fuerte
    return negativeCount <= 1;
  }
}
