import { Plant } from '../../domain/entities/Plant';
import { Individual } from '../../domain/entities/Individual';
import { PlantRepository } from '../../domain/repositories/PlantRepository';
import { CompatibilityMatrixRepository } from '../../domain/repositories/CompatibilityMatrixRepository';
import { GeneticAlgorithmService, GAConfig, GAConstraints } from '../../domain/services/GeneticAlgorithmService';
import { FitnessCalculatorService, Objective } from '../../domain/services/FitnessCalculatorService';
import { CalendarGeneratorService } from '../../domain/services/CalendarGeneratorService';
import { CategoryDistribution } from '../../domain/value-objects/CategoryDistribution';
import { GenerateGardenRequestDto } from '../dtos/GenerateGardenRequestDto';
import { GenerateGardenResponseDto, SolutionDto } from '../dtos/GenerateGardenResponseDto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class GenerateGardenUseCase {
  constructor(
    private plantRepository: PlantRepository,
    private compatibilityMatrixRepository: CompatibilityMatrixRepository
  ) {}

  async execute(request: GenerateGardenRequestDto): Promise<GenerateGardenResponseDto> {
    try {
      // 1. Normalizar y validar request
      const normalizedRequest = this.normalizeRequest(request);

      logger.info('Generando huerto', { request: normalizedRequest });

      // 2. Cargar plantas y matriz de compatibilidad
      const plants = await this.plantRepository.findAll();
      const compatibilityMatrix = await this.compatibilityMatrixRepository.getAllCompatibilities();

      // 3. Configurar calculador de fitness
      const fitnessCalculator = new FitnessCalculatorService({
        compatibilityMatrix,
        objective: normalizedRequest.objective,
        desiredCategoryDistribution: normalizedRequest.categoryDistribution,
        maxWaterWeekly: normalizedRequest.waterLimit,
      });

      // 4. Configurar AG
      const agConfig: GAConfig = {
        populationSize: env.ag.populationSize,
        maxGenerations: env.ag.maxGenerations,
        crossoverProbability: env.ag.crossoverProbability,
        mutationRate: env.ag.mutationRate,
        tournamentK: env.ag.tournamentK,
        eliteCount: env.ag.eliteCount,
        patience: env.ag.patience,
        convergenceThreshold: env.ag.convergenceThreshold,
        timeout: env.timeouts.agExecutionMs,
      };

      const ga = new GeneticAlgorithmService(plants, fitnessCalculator, agConfig);

      // 5. Ejecutar AG
      const constraints: GAConstraints = {
        maxArea: normalizedRequest.dimensions.width * normalizedRequest.dimensions.height,
        maxWaterWeekly: normalizedRequest.waterLimit,
        maxBudget: normalizedRequest.budget,
        desiredCategoryDistribution: normalizedRequest.categoryDistribution,
      };

      const result = await ga.run(constraints, normalizedRequest.objective);

      // 6. Generar calendarios
      const calendarGenerator = new CalendarGeneratorService();

      // 7. Transformar a DTOs (Top 3 soluciones)
      const solutions: SolutionDto[] = result.topSolutions.slice(0, 3).map((individual, index) => {
        const calendar = calendarGenerator.generateCalendar(individual, normalizedRequest.location);
        return this.transformToSolutionDto(individual, index + 1, calendar, compatibilityMatrix);
      });

      // 8. Construir respuesta
      return {
        success: true,
        solutions,
        metadata: {
          executionTimeMs: result.executionTimeMs,
          totalGenerations: result.generations,
          convergenceGeneration: result.convergenceGeneration,
          populationSize: agConfig.populationSize,
          stoppingReason: result.stoppingReason,
          inputParameters: normalizedRequest,
          weightsApplied: fitnessCalculator.getWeights(),
        },
      };
    } catch (error: any) {
      logger.error('Error generando huerto', { error: error.message });
      throw error;
    }
  }

  /**
   * Normaliza el request, aplicando defaults cuando sea necesario.
   */
  private normalizeRequest(request: GenerateGardenRequestDto): Required<GenerateGardenRequestDto> {
    const randomArea = 1 + Math.random() * 4; // 1-5 m²
    const randomWidth = Math.sqrt(randomArea * (0.5 + Math.random()));
    const randomHeight = randomArea / randomWidth;

    return {
      userId: request.userId || undefined,
      desiredPlants: request.desiredPlants || [],
      dimensions: request.dimensions || {
        width: randomWidth,
        height: randomHeight,
      },
      waterLimit: request.waterLimit || randomArea * (50 + Math.random() * 30), // 50-80 L/m²/semana
      userExperience: request.userExperience || 2,
      season: request.season || 'auto',
      location: request.location || {
        lat: env.location.defaultLatitude,
        lon: env.location.defaultLongitude,
      },
      categoryDistribution: request.categoryDistribution
        ? new CategoryDistribution(request.categoryDistribution)
        : new CategoryDistribution(),
      budget: request.budget || randomArea * 200, // 200 MXN/m²
      objective: request.objective || 'alimenticio',
      maintenanceMinutes: request.maintenanceMinutes || (request.userExperience || 2) * 60,
    };
  }

  /**
   * Transforma Individual a SolutionDto.
   */
  private transformToSolutionDto(
    individual: Individual,
    rank: number,
    calendar: any,
    compatibilityMatrix: Map<string, Map<string, number>>
  ): SolutionDto {
    // Calcular estimaciones
    const estimations = this.calculateEstimations(individual);

    // Extraer matriz de compatibilidad entre las plantas del layout
    const compatibilityList = this.extractCompatibilityList(individual, compatibilityMatrix);

    // Calcular breakdown de categorías
    const categoryBreakdown: Record<string, number> = {
      vegetable: 0,
      medicinal: 0,
      aromatic: 0,
      ornamental: 0,
    };

    individual.plants.forEach(p => {
      p.plant.type.forEach(type => {
        if (type in categoryBreakdown) {
          categoryBreakdown[type] += p.quantity;
        }
      });
    });

    const total = Object.values(categoryBreakdown).reduce((sum, v) => sum + v, 0);
    if (total > 0) {
      Object.keys(categoryBreakdown).forEach(key => {
        categoryBreakdown[key] = Math.round((categoryBreakdown[key] / total) * 100);
      });
    }

    return {
      rank,
      layout: {
        dimensions: individual.dimensions.toJSON(),
        plants: individual.plants.map(p => p.toJSON() as any),
        totalPlants: individual.totalPlants,
        usedArea: individual.usedArea,
        availableArea: individual.availableArea,
        categoryBreakdown,
      },
      metrics: individual.metrics!.toJSON(),
      estimations,
      calendar,
      compatibilityMatrix: compatibilityList,
    };
  }

  /**
   * Calcula estimaciones de producción, agua, costo y mantenimiento.
   */
  private calculateEstimations(individual: Individual) {
    // Producción mensual estimada (kg)
    // Asumiendo ~2 kg/m²/mes para vegetales
    const vegetableArea = individual.plants
      .filter(p => p.plant.hasType('vegetable'))
      .reduce((sum, p) => sum + p.totalArea, 0);
    const monthlyProductionKg = vegetableArea * 2;

    // Agua semanal
    const weeklyWaterLiters = individual.totalWeeklyWater;

    // Costo de implementación
    const implementationCostMXN = individual.totalCost;

    // Mantenimiento semanal (15 min por planta)
    const maintenanceMinutesPerWeek = individual.totalPlants * 15;

    return {
      monthlyProductionKg: parseFloat(monthlyProductionKg.toFixed(1)),
      weeklyWaterLiters: parseFloat(weeklyWaterLiters.toFixed(1)),
      implementationCostMXN: parseFloat(implementationCostMXN.toFixed(2)),
      maintenanceMinutesPerWeek,
    };
  }

  /**
   * Extrae lista de compatibilidades entre plantas del layout.
   */
  private extractCompatibilityList(
    individual: Individual,
    compatibilityMatrix: Map<string, Map<string, number>>
  ) {
    const compatibilities: SolutionDto['compatibilityMatrix'] = [];

    for (let i = 0; i < individual.plants.length; i++) {
      for (let j = i + 1; j < individual.plants.length; j++) {
        const plant1 = individual.plants[i].plant.species;
        const plant2 = individual.plants[j].plant.species;

        const score = compatibilityMatrix.get(plant1)?.get(plant2) || 0;

        const relation = score > 0.5 ? 'benefica' : score < -0.5 ? 'perjudicial' : 'neutral';

        compatibilities.push({
          plant1,
          plant2,
          score: parseFloat(score.toFixed(2)),
          relation,
        });
      }
    }

    return compatibilities;
  }
}
