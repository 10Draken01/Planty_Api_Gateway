import { Individual } from '../entities/Individual';
import { Plant } from '../entities/Plant';
import { PlantInstance } from '../entities/PlantInstance';
import { Dimensions } from '../value-objects/Dimensions';
import { Position } from '../value-objects/Position';
import { FitnessCalculatorService, Objective } from './FitnessCalculatorService';
import { CategoryDistribution } from '../value-objects/CategoryDistribution';
import { logger } from '../../config/logger';

export interface GAConfig {
  populationSize: number;
  maxGenerations: number;
  crossoverProbability: number;
  mutationRate: number;
  tournamentK: number;
  eliteCount: number;
  patience: number;
  convergenceThreshold: number;
  timeout?: number; // Timeout en ms
  seed?: number; // Semilla para reproducibilidad
}

export interface GAConstraints {
  maxArea: number;
  maxWaterWeekly: number;
  maxBudget?: number;
  desiredCategoryDistribution?: CategoryDistribution;
  desiredPlantSpecies?: string[];
}

export interface GAResult {
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
  }>;
}

/**
 * Servicio del Algoritmo Genético para optimización de huertos.
 * Basado en la especificación LaTeX Capítulo 3.
 */
export class GeneticAlgorithmService {
  private config: GAConfig;
  private plants: Plant[];
  private fitnessCalculator: FitnessCalculatorService;
  private rng: () => number;

  private generationStats: GAResult['generationStats'] = [];

  constructor(
    plants: Plant[],
    fitnessCalculator: FitnessCalculatorService,
    config: GAConfig
  ) {
    this.plants = plants;
    this.fitnessCalculator = fitnessCalculator;
    this.config = config;

    // Inicializar RNG
    if (config.seed !== undefined) {
      this.rng = this.seededRandom(config.seed);
    } else {
      this.rng = Math.random;
    }
  }

  /**
   * Ejecuta el algoritmo genético completo.
   */
  async run(constraints: GAConstraints, objective: Objective): Promise<GAResult> {
    const startTime = Date.now();
    let stoppingReason: GAResult['stoppingReason'] = 'max_generations';

    logger.info('Iniciando Algoritmo Genético', {
      population: this.config.populationSize,
      maxGenerations: this.config.maxGenerations,
      objective,
    });

    // FASE 1: Inicialización
    let population = this.initializePopulation(constraints);

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

      // FASE 3: Cruza de Dos Puntos
      const offspring: Individual[] = [];
      for (let i = 0; i < selected.length; i += 2) {
        if (i + 1 < selected.length) {
          if (this.rng() < this.config.crossoverProbability) {
            const [child1, child2] = this.twoPointCrossover(selected[i], selected[i + 1]);
            offspring.push(child1, child2);
          } else {
            offspring.push(selected[i].clone(), selected[i + 1].clone());
          }
        }
      }

      // FASE 4: Mutación por Intercambio
      offspring.forEach(ind => {
        if (this.rng() < this.config.mutationRate) {
          this.swapMutation(ind);
        }
      });

      // FASE 5: Evaluación
      offspring.forEach(ind => {
        ind.metrics = this.fitnessCalculator.calculate(ind);
      });

      // FASE 6: Reemplazo Generacional con Elitismo (μ+λ)
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

      // Guardar estadísticas cada 10 generaciones
      if (generation % 10 === 0 || generation === this.config.maxGenerations - 1) {
        const avgFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
        const diversity = this.calculateDiversity(population);

        this.generationStats.push({
          generation,
          bestFitness: currentBest,
          avgFitness,
          diversity,
        });

        logger.debug(`Generación ${generation}`, {
          bestFitness: currentBest.toFixed(4),
          avgFitness: avgFitness.toFixed(4),
          diversity: diversity.toFixed(4),
        });
      }

      // FASE 7: Criterios de parada

      // Paciencia: Sin mejora significativa
      if (generationsWithoutImprovement >= this.config.patience) {
        logger.info(`Convergencia por paciencia: ${this.config.patience} generaciones sin mejora`);
        stoppingReason = 'patience';
        break;
      }

      // Convergencia: Varianza de fitness muy baja
      const fitnessVariance = this.calculateVariance(population.map(ind => ind.fitness));
      if (fitnessVariance < this.config.convergenceThreshold) {
        logger.info(`Convergencia: varianza < ${this.config.convergenceThreshold}`);
        stoppingReason = 'convergence';
        break;
      }
    }

    // Ordenar por fitness y retornar top 3
    population.sort((a, b) => b.fitness - a.fitness);
    const topSolutions = population.slice(0, 3);

    const executionTime = Date.now() - startTime;

    logger.info('Algoritmo Genético finalizado', {
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
    };
  }

  /**
   * FASE 1: Inicialización de población.
   * Genera individuos aleatorios respetando restricciones hard.
   */
  private initializePopulation(constraints: GAConstraints): Individual[] {
    const population: Individual[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const individual = this.createRandomIndividual(constraints);
      population.push(individual);
    }

    return population;
  }

  /**
   * Crea un individuo aleatorio válido.
   */
  private createRandomIndividual(constraints: GAConstraints): Individual {
    // Determinar dimensiones del huerto
    const area = constraints.maxArea;
    const aspectRatio = 0.5 + this.rng() * 1.5; // Ratio 0.5 a 2.0
    const width = Math.sqrt(area * aspectRatio);
    const height = area / width;

    const dimensions = new Dimensions(width, height);

    // Seleccionar plantas aleatorias
    const availablePlants = [...this.plants];
    this.shuffleArray(availablePlants);

    const plantInstances: PlantInstance[] = [];
    let usedArea = 0;
    let usedWater = 0;
    let usedBudget = 0;

    let x = 0;
    let y = 0;

    for (const plant of availablePlants) {
      const quantity = 1 + Math.floor(this.rng() * 3); // 1-3 plantas
      const plantArea = plant.size * quantity;
      const plantWater = plant.weeklyWatering * quantity;
      const plantCost = plant.estimatedCost() * quantity;

      // Verificar restricciones
      if (
        usedArea + plantArea <= constraints.maxArea * 0.85 &&
        usedWater + plantWater <= constraints.maxWaterWeekly &&
        (!constraints.maxBudget || usedBudget + plantCost <= constraints.maxBudget)
      ) {
        const position = new Position(x, y);
        const instance = new PlantInstance({
          plant,
          quantity,
          position,
        });

        plantInstances.push(instance);
        usedArea += plantArea;
        usedWater += plantWater;
        usedBudget += plantCost;

        // Avanzar posición en grid
        x += plant.size;
        if (x >= width) {
          x = 0;
          y += plant.size;
        }

        // Límite de plantas por individuo
        if (plantInstances.length >= 15) break;
      }
    }

    // Crear genoma (simplificado - no usado en esta versión)
    const genome: (number | null)[][] = [];

    return new Individual(dimensions, genome, plantInstances);
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

      // Seleccionar el mejor del torneo
      const winner = tournament.reduce((best, current) =>
        current.fitness > best.fitness ? current : best
      );

      selected.push(winner);
    }

    return selected;
  }

  /**
   * FASE 3: Cruza de Dos Puntos.
   * Intercambia segmentos de plantas entre dos padres.
   */
  private twoPointCrossover(parent1: Individual, parent2: Individual): [Individual, Individual] {
    if (parent1.plants.length < 3 || parent2.plants.length < 3) {
      return [parent1.clone(), parent2.clone()];
    }

    const len1 = parent1.plants.length;
    const len2 = parent2.plants.length;

    const cut1 = Math.floor(this.rng() * (len1 - 2)) + 1;
    const cut2 = Math.floor(this.rng() * (len2 - 2)) + 1;

    // Crear hijos intercambiando segmentos
    const child1Plants = [
      ...parent1.plants.slice(0, cut1),
      ...parent2.plants.slice(cut2),
    ];

    const child2Plants = [
      ...parent2.plants.slice(0, cut2),
      ...parent1.plants.slice(cut1),
    ];

    const child1 = new Individual(parent1.dimensions, [], child1Plants);
    const child2 = new Individual(parent2.dimensions, [], child2Plants);

    return [child1, child2];
  }

  /**
   * FASE 4: Mutación por Intercambio.
   * Intercambia dos plantas aleatorias.
   */
  private swapMutation(individual: Individual): void {
    if (individual.plants.length < 2) return;

    const idx1 = Math.floor(this.rng() * individual.plants.length);
    let idx2 = Math.floor(this.rng() * individual.plants.length);

    while (idx2 === idx1) {
      idx2 = Math.floor(this.rng() * individual.plants.length);
    }

    // Intercambiar
    [individual.plants[idx1], individual.plants[idx2]] = [
      individual.plants[idx2],
      individual.plants[idx1],
    ];
  }

  /**
   * FASE 6: Reemplazo Generacional con Elitismo (μ+λ).
   * Combina padres e hijos, selecciona los mejores.
   */
  private elitistReplacement(parents: Individual[], offspring: Individual[]): Individual[] {
    const combined = [...parents, ...offspring];
    combined.sort((a, b) => b.fitness - a.fitness);
    return combined.slice(0, this.config.populationSize);
  }

  /**
   * Calcula la diversidad de la población (varianza de fitness normalizada).
   */
  private calculateDiversity(population: Individual[]): number {
    const fitnesses = population.map(ind => ind.fitness);
    return this.calculateVariance(fitnesses);
  }

  /**
   * Calcula varianza de un array de números.
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
   * Generador de números aleatorios con semilla (para reproducibilidad).
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
