import { Individual } from '../entities/Individual';
import { Plant } from '../entities/Plant';
import { PlantInstance } from '../entities/PlantInstance';
import { Dimensions } from '../value-objects/Dimensions';
import { Position } from '../value-objects/Position';
import { ImprovedFitnessCalculator, Objective } from './ImprovedFitnessCalculator';
import { PlantSelectorService } from './PlantSelectorService';
import { CategoryDistribution } from '../value-objects/CategoryDistribution';
import { logger } from '../../config/logger';

export interface ImprovedGAConfig {
  populationSize: number;
  maxGenerations: number;
  crossoverProbability: number;
  mutationRate: number;
  insertionRate: number; // NUEVO: probabilidad de insertar nueva planta
  deletionRate: number; // NUEVO: probabilidad de eliminar planta
  tournamentK: number;
  eliteCount: number;
  patience: number;
  convergenceThreshold: number;
  timeout?: number;
  seed?: number;
  maxSpecies: number; // NUEVO: máximo de especies simultáneas (3 o 5)
}

export interface ImprovedGAConstraints {
  maxArea: number;
  maxWaterWeekly: number;
  maxBudget?: number;
  desiredCategoryDistribution?: CategoryDistribution;
  desiredPlantIds?: number[]; // MEJORADO: IDs de plantas deseadas por usuario
}

export interface ImprovedGAResult {
  topSolutions: Individual[];
  generations: number;
  convergenceGeneration: number;
  stoppingReason: 'convergence' | 'max_generations' | 'timeout' | 'patience';
  executionTimeMs: number;
  generationStats: Array<{
    generation: number;
    bestFitness: number;
    avgFitness: number;
    diversity: number;
    avgSpeciesCount: number;
  }>;
  selectedPlants: Plant[]; // NUEVO: plantas seleccionadas para el pool
}

/**
 * Algoritmo Genético MEJORADO para optimización de huertos.
 *
 * MEJORAS PRINCIPALES:
 * 1. Selección inteligente de plantas (PlantSelectorService)
 * 2. Operadores genéticos avanzados (inserción, eliminación, cruza uniforme)
 * 3. Inicialización heurística inteligente
 * 4. Diversidad genética controlada
 * 5. Límite de especies simultáneas
 */
export class ImprovedGeneticAlgorithm {
  private config: ImprovedGAConfig;
  private allPlants: Plant[];
  private selectedPlants: Plant[]; // Pool restringido de plantas
  private fitnessCalculator: ImprovedFitnessCalculator;
  private rng: () => number;
  private generationStats: ImprovedGAResult['generationStats'] = [];

  constructor(
    allPlants: Plant[],
    fitnessCalculator: ImprovedFitnessCalculator,
    config: ImprovedGAConfig
  ) {
    this.allPlants = allPlants;
    this.fitnessCalculator = fitnessCalculator;
    this.config = config;

    // Inicializar RNG
    this.rng = config.seed !== undefined ? this.seededRandom(config.seed) : Math.random;

    this.selectedPlants = []; // Se inicializa en run()
  }

  /**
   * Ejecuta el algoritmo genético completo.
   */
  async run(
    constraints: ImprovedGAConstraints,
    objective: Objective
  ): Promise<ImprovedGAResult> {
    const startTime = Date.now();
    let stoppingReason: ImprovedGAResult['stoppingReason'] = 'max_generations';

    logger.info('Iniciando Algoritmo Genético MEJORADO', {
      population: this.config.populationSize,
      maxGenerations: this.config.maxGenerations,
      maxSpecies: this.config.maxSpecies,
      objective,
    });

    // FASE 0: Selección inteligente de plantas
    this.selectedPlants = this.selectPlantsIntelligently(constraints, objective);

    logger.info(`Plantas seleccionadas: ${this.selectedPlants.length}`, {
      species: this.selectedPlants.map(p => p.species),
    });

    // FASE 1: Inicialización heurística
    let population = this.initializePopulationHeuristic(constraints);

    // Evaluar población inicial
    population.forEach(ind => {
      ind.metrics = this.fitnessCalculator.calculate(ind);
    });

    let bestFitness = Math.max(...population.map(ind => ind.fitness));
    let generationsWithoutImprovement = 0;

    // CICLO EVOLUTIVO
    for (let generation = 0; generation < this.config.maxGenerations; generation++) {
      // Verificar timeout
      if (this.config.timeout && Date.now() - startTime > this.config.timeout) {
        logger.warn('Algoritmo Genético detenido por timeout');
        stoppingReason = 'timeout';
        break;
      }

      // FASE 2: Selección por Torneo
      const selected = this.tournamentSelection(population);

      // FASE 3: Reproducción (Cruza + Mutación + Inserción + Eliminación)
      const offspring: Individual[] = [];
      for (let i = 0; i < selected.length; i += 2) {
        if (i + 1 < selected.length) {
          // Cruza
          if (this.rng() < this.config.crossoverProbability) {
            const [child1, child2] = this.uniformCrossover(selected[i], selected[i + 1]);
            offspring.push(child1, child2);
          } else {
            offspring.push(selected[i].clone(), selected[i + 1].clone());
          }
        }
      }

      // FASE 4: Mutación múltiple
      offspring.forEach(ind => {
        // Mutación por intercambio de posiciones
        if (this.rng() < this.config.mutationRate) {
          this.swapMutation(ind);
        }

        // Mutación por inserción de nueva planta
        if (this.rng() < this.config.insertionRate) {
          this.insertMutation(ind, constraints);
        }

        // Mutación por eliminación de planta
        if (this.rng() < this.config.deletionRate) {
          this.deleteMutation(ind);
        }

        // Mutación de posición (mover planta existente)
        if (this.rng() < this.config.mutationRate * 0.5) {
          this.positionMutation(ind);
        }
      });

      // FASE 5: Evaluación
      offspring.forEach(ind => {
        ind.metrics = this.fitnessCalculator.calculate(ind);
      });

      // FASE 6: Reemplazo Generacional con Elitismo
      population = this.elitistReplacement(population, offspring);

      // Verificar mejora
      const currentBest = Math.max(...population.map(ind => ind.fitness));
      const improvement = currentBest - bestFitness;

      if (improvement > 0.001) {
        bestFitness = currentBest;
        generationsWithoutImprovement = 0;
      } else {
        generationsWithoutImprovement++;
      }

      // Guardar estadísticas
      if (generation % 10 === 0 || generation === this.config.maxGenerations - 1) {
        const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
        const diversity = this.calculateDiversity(population);
        const avgSpeciesCount =
          population.reduce((sum, ind) => sum + ind.plants.length, 0) / population.length;

        this.generationStats.push({
          generation,
          bestFitness: currentBest,
          avgFitness,
          diversity,
          avgSpeciesCount,
        });

        logger.debug(`Generación ${generation}`, {
          bestFitness: currentBest.toFixed(4),
          avgFitness: avgFitness.toFixed(4),
          diversity: diversity.toFixed(4),
          avgSpecies: avgSpeciesCount.toFixed(1),
        });
      }

      // FASE 7: Criterios de parada
      if (generationsWithoutImprovement >= this.config.patience) {
        logger.info(`Convergencia por paciencia: ${this.config.patience} generaciones sin mejora`);
        stoppingReason = 'patience';
        break;
      }

      const fitnessVariance = this.calculateVariance(population.map(ind => ind.fitness));
      if (fitnessVariance < this.config.convergenceThreshold) {
        logger.info(`Convergencia: varianza < ${this.config.convergenceThreshold}`);
        stoppingReason = 'convergence';
        break;
      }
    }

    // Ordenar y retornar top 3
    population.sort((a, b) => b.fitness - a.fitness);
    const topSolutions = population.slice(0, 3);

    const executionTime = Date.now() - startTime;

    logger.info('Algoritmo Genético MEJORADO finalizado', {
      generations: this.generationStats.length * 10,
      bestFitness: topSolutions[0].fitness.toFixed(4),
      executionTimeMs: executionTime,
      stoppingReason,
    });

    return {
      topSolutions,
      generations: this.generationStats.length * 10,
      convergenceGeneration: this.generationStats.length * 10,
      stoppingReason,
      executionTimeMs: executionTime,
      generationStats: this.generationStats,
      selectedPlants: this.selectedPlants,
    };
  }

  /**
   * FASE 0: Selección inteligente de plantas.
   */
  private selectPlantsIntelligently(
    constraints: ImprovedGAConstraints,
    objective: Objective
  ): Plant[] {
    const selector = new PlantSelectorService({
      desiredPlantIds: constraints.desiredPlantIds, // MEJORADO: usar IDs
      maxSpecies: this.config.maxSpecies,
      objective,
      compatibilityMatrix: this.fitnessCalculator['config'].compatibilityMatrix,
    });

    return selector.selectBestPlants(this.allPlants);
  }

  /**
   * FASE 1: Inicialización heurística de población.
   *
   * MEJORAS:
   * - Inicializa con plantas seleccionadas inteligentemente
   * - Distribuye plantas considerando compatibilidad
   * - Genera individuos con diversidad controlada
   */
  private initializePopulationHeuristic(constraints: ImprovedGAConstraints): Individual[] {
    const population: Individual[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const individual = this.createSmartIndividual(constraints, i);
      population.push(individual);
    }

    return population;
  }

  /**
   * Crea un individuo inteligente usando heurísticas.
   *
   * NUEVO ENFOQUE:
   * - Cada PlantInstance = 1 planta en 1 posición
   * - Genera múltiples instancias de la misma especie si es necesario
   * - Usa espaciamiento basado en compatibilidad
   * - Evita colisiones y valida límites
   */
  private createSmartIndividual(constraints: ImprovedGAConstraints, _seed: number): Individual {
    const area = constraints.maxArea;
    const aspectRatio = 0.6 + this.rng() * 0.8; // Ratio 0.6 a 1.4
    const width = Math.sqrt(area * aspectRatio);
    const height = area / width;

    const dimensions = new Dimensions(width, height);

    // Determinar cuántas especies incluir (entre 2 y maxSpecies)
    const numSpecies = Math.min(
      this.selectedPlants.length,
      2 + Math.floor(this.rng() * (this.config.maxSpecies - 1))
    );

    // Seleccionar plantas del pool
    const shuffled = [...this.selectedPlants];
    this.shuffleArray(shuffled);
    const chosenPlants = shuffled.slice(0, numSpecies);

    const plantInstances: PlantInstance[] = [];
    let usedArea = 0;
    let usedWater = 0;
    let usedBudget = 0;

    // Estrategia: Distribuir en grid con espaciamiento inteligente
    // Cada especie puede tener 1-3 plantas individuales
    for (const plant of chosenPlants) {
      const plantsOfThisSpecies = 1 + Math.floor(this.rng() * 2); // 1-2 plantas por especie

      for (let i = 0; i < plantsOfThisSpecies; i++) {
        // Intentar encontrar una posición válida
        let attempts = 0;
        let validPosition = false;

        while (attempts < 50 && !validPosition) {
          // Generar posición aleatoria con margen
          const margin = Math.sqrt(plant.size); // Margen basado en tamaño de planta
          const x = margin + this.rng() * (width - 2 * margin);
          const y = margin + this.rng() * (height - 2 * margin);
          const position = new Position(x, y);

          // Crear instancia temporal para validar
          const tempInstance = new PlantInstance({
            plant,
            position,
          });

          // Verificar que no haya colisiones
          const hasCollision = plantInstances.some(existing => {
            return tempInstance.overlaps(existing) ||
                   !this.hasAdequateSpacing(tempInstance, existing);
          });

          // Verificar que esté dentro de los límites
          const withinBounds =
            x + tempInstance.width <= width &&
            y + tempInstance.height <= height &&
            x >= 0 && y >= 0;

          // Verificar restricciones de recursos
          const plantArea = tempInstance.totalArea;
          const plantWater = tempInstance.totalWeeklyWater;
          const plantCost = tempInstance.totalCost;

          const withinConstraints =
            usedArea + plantArea <= constraints.maxArea * 0.85 &&
            usedWater + plantWater <= constraints.maxWaterWeekly &&
            (!constraints.maxBudget || usedBudget + plantCost <= constraints.maxBudget);

          if (!hasCollision && withinBounds && withinConstraints) {
            plantInstances.push(tempInstance);
            usedArea += plantArea;
            usedWater += plantWater;
            usedBudget += plantCost;
            validPosition = true;
          }

          attempts++;
        }
      }
    }

    return new Individual(dimensions, [], plantInstances);
  }

  /**
   * Verifica que dos plantas tengan espaciamiento adecuado según compatibilidad
   */
  private hasAdequateSpacing(plant1: PlantInstance, plant2: PlantInstance): boolean {
    const distance = plant1.distanceTo(plant2);
    const compatibility = this.getCompatibilityScore(plant1.plant.species, plant2.plant.species);

    // Distancia mínima según compatibilidad
    let minDistance: number;
    if (compatibility < -0.5) {
      minDistance = 2.0; // Incompatibles: 2m mínimo
    } else if (compatibility > 0.5) {
      minDistance = 0.8; // Compatibles: 0.8m mínimo
    } else {
      minDistance = 1.2; // Neutras: 1.2m mínimo
    }

    // Agregar radios de las plantas
    const radius1 = Math.sqrt(plant1.plant.size) / 2;
    const radius2 = Math.sqrt(plant2.plant.size) / 2;

    return distance >= minDistance + radius1 + radius2;
  }

  /**
   * Obtiene score de compatibilidad entre dos especies
   */
  private getCompatibilityScore(species1: string, species2: string): number {
    const matrix = this.fitnessCalculator['config'].compatibilityMatrix;
    const species1Map = matrix?.get(species1);
    if (!species1Map) return 0;
    return species1Map.get(species2) ?? 0;
  }

  /**
   * FASE 2: Selección por Torneo.
   */
  private tournamentSelection(population: Individual[]): Individual[] {
    const selected: Individual[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const tournament: Individual[] = [];

      for (let j = 0; j < this.config.tournamentK; j++) {
        const randomIndex = Math.floor(this.rng() * population.length);
        tournament.push(population[randomIndex]);
      }

      const winner = tournament.reduce((best, current) =>
        current.fitness > best.fitness ? current : best
      );

      selected.push(winner);
    }

    return selected;
  }

  /**
   * FASE 3: Cruza Uniforme (MEJORADA).
   *
   * Intercambia plantas aleatoriamente entre padres.
   */
  private uniformCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    if (parent1.plants.length === 0 || parent2.plants.length === 0) {
      return [parent1.clone(), parent2.clone()];
    }

    const child1Plants: PlantInstance[] = [];
    const child2Plants: PlantInstance[] = [];

    const maxLen = Math.max(parent1.plants.length, parent2.plants.length);

    for (let i = 0; i < maxLen; i++) {
      if (this.rng() < 0.5) {
        if (i < parent1.plants.length) child1Plants.push(parent1.plants[i]);
        if (i < parent2.plants.length) child2Plants.push(parent2.plants[i]);
      } else {
        if (i < parent2.plants.length) child1Plants.push(parent2.plants[i]);
        if (i < parent1.plants.length) child2Plants.push(parent1.plants[i]);
      }
    }

    const child1 = new Individual(parent1.dimensions, [], child1Plants);
    const child2 = new Individual(parent2.dimensions, [], child2Plants);

    return [child1, child2];
  }

  /**
   * FASE 4: Mutación por intercambio.
   */
  private swapMutation(individual: Individual): void {
    if (individual.plants.length < 2) return;

    const idx1 = Math.floor(this.rng() * individual.plants.length);
    let idx2 = Math.floor(this.rng() * individual.plants.length);

    while (idx2 === idx1 && individual.plants.length > 1) {
      idx2 = Math.floor(this.rng() * individual.plants.length);
    }

    [individual.plants[idx1], individual.plants[idx2]] = [
      individual.plants[idx2],
      individual.plants[idx1],
    ];
  }

  /**
   * FASE 4: Mutación por inserción (ACTUALIZADO).
   *
   * Inserta una nueva planta del pool con validación de espaciamiento.
   */
  private insertMutation(individual: Individual, constraints: ImprovedGAConstraints): void {
    // Límite: no exceder maxSpecies * 3 plantas totales (permitir duplicados)
    if (individual.plants.length >= this.config.maxSpecies * 3) return;

    // Seleccionar planta aleatoria del pool
    const newPlant = this.selectedPlants[Math.floor(this.rng() * this.selectedPlants.length)];

    // Intentar encontrar posición válida
    let attempts = 0;
    while (attempts < 30) {
      const margin = Math.sqrt(newPlant.size);
      const x = margin + this.rng() * (individual.dimensions.width - 2 * margin);
      const y = margin + this.rng() * (individual.dimensions.height - 2 * margin);
      const position = new Position(x, y);

      const instance = new PlantInstance({
        plant: newPlant,
        position,
      });

      // Verificar colisiones y espaciamiento
      const hasCollision = individual.plants.some(existing => {
        return instance.overlaps(existing) || !this.hasAdequateSpacing(instance, existing);
      });

      // Verificar límites
      const withinBounds =
        x + instance.width <= individual.dimensions.width &&
        y + instance.height <= individual.dimensions.height;

      // Verificar restricciones de recursos
      const newUsedArea = individual.usedArea + instance.totalArea;
      const newWater = individual.totalWeeklyWater + instance.totalWeeklyWater;

      if (
        !hasCollision &&
        withinBounds &&
        newUsedArea <= constraints.maxArea * 0.85 &&
        newWater <= constraints.maxWaterWeekly
      ) {
        individual.plants.push(instance);
        return; // Éxito
      }

      attempts++;
    }
    // Si no encuentra posición válida después de 30 intentos, no inserta nada
  }

  /**
   * FASE 4: Mutación por eliminación (NUEVO).
   *
   * Elimina una planta aleatoria.
   */
  private deleteMutation(individual: Individual): void {
    if (individual.plants.length <= 2) return; // Mantener al menos 2 especies

    const idx = Math.floor(this.rng() * individual.plants.length);
    individual.plants.splice(idx, 1);
  }

  /**
   * FASE 4: Mutación de posición (ACTUALIZADO).
   *
   * Mueve una planta a una nueva posición válida.
   */
  private positionMutation(individual: Individual): void {
    if (individual.plants.length === 0) return;

    const idx = Math.floor(this.rng() * individual.plants.length);
    const plantToMove = individual.plants[idx];

    // Intentar encontrar nueva posición válida
    let attempts = 0;
    while (attempts < 20) {
      const margin = Math.sqrt(plantToMove.plant.size);
      const newX = margin + this.rng() * (individual.dimensions.width - 2 * margin);
      const newY = margin + this.rng() * (individual.dimensions.height - 2 * margin);
      const newPosition = new Position(newX, newY);

      const movedPlant = new PlantInstance({
        plant: plantToMove.plant,
        position: newPosition,
        width: plantToMove.width,
        height: plantToMove.height,
        rotation: plantToMove.rotation,
      });

      // Verificar colisiones con otras plantas (excluyendo la actual)
      const otherPlants = individual.plants.filter((_, i) => i !== idx);
      const hasCollision = otherPlants.some(existing => {
        return movedPlant.overlaps(existing) || !this.hasAdequateSpacing(movedPlant, existing);
      });

      // Verificar límites
      const withinBounds =
        newX + movedPlant.width <= individual.dimensions.width &&
        newY + movedPlant.height <= individual.dimensions.height;

      if (!hasCollision && withinBounds) {
        individual.plants[idx] = movedPlant;
        return; // Éxito
      }

      attempts++;
    }
    // Si no encuentra posición válida, mantiene la posición original
  }

  /**
   * FASE 6: Reemplazo Generacional con Elitismo.
   */
  private elitistReplacement(parents: Individual[], offspring: Individual[]): Individual[] {
    const combined = [...parents, ...offspring];
    combined.sort((a, b) => b.fitness - a.fitness);
    return combined.slice(0, this.config.populationSize);
  }

  /**
   * Calcula la diversidad de la población.
   */
  private calculateDiversity(population: Individual[]): number {
    const fitnesses = population.map(ind => ind.fitness);
    return this.calculateVariance(fitnesses);
  }

  /**
   * Calcula varianza.
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * RNG con semilla
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
