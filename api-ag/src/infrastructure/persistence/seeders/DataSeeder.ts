import fs from 'fs';
import path from 'path';
import { Plant } from '../../../domain/entities/Plant';
import { PlantRepository } from '../../../domain/repositories/PlantRepository';
import { CompatibilityMatrixRepository, CompatibilityEntry } from '../../../domain/repositories/CompatibilityMatrixRepository';
import { logger } from '../../../config/logger';

export class DataSeeder {
  constructor(
    private plantRepository: PlantRepository,
    private compatibilityMatrixRepository: CompatibilityMatrixRepository
  ) {}

  async seed(): Promise<void> {
    try {
      logger.info('Iniciando seed de datos...');

      // Verificar si ya existen datos
      const plantsCount = await this.plantRepository.count();
      const matrixCount = await this.compatibilityMatrixRepository.count();

      if (plantsCount > 0 && matrixCount > 0) {
        logger.info('Datos ya existentes en BD, omitiendo seed');
        return;
      }

      // Cargar plantas
      if (plantsCount === 0) {
        await this.seedPlants();
      }

      // Cargar matriz de compatibilidad
      if (matrixCount === 0) {
        await this.seedCompatibilityMatrix();
      }

      // Cachear matriz de compatibilidad
      await this.compatibilityMatrixRepository.getAllCompatibilities();

      logger.info('Seed de datos completado exitosamente');
    } catch (error) {
      logger.error('Error durante seed de datos', { error });
      throw error;
    }
  }

  private async seedPlants(): Promise<void> {
    const plantsPath = path.join(__dirname, '../../../../data/plants_with_id.json');

    if (!fs.existsSync(plantsPath)) {
      logger.warn(`Archivo no encontrado: ${plantsPath}`);
      return;
    }

    const plantsData = JSON.parse(fs.readFileSync(plantsPath, 'utf-8'));

    const plants = plantsData.map((p: any) => new Plant({
      id: p.id,
      species: p.species,
      scientificName: p.scientificName,
      type: p.type,
      sunRequirement: p.sunRequirement,
      weeklyWatering: p.weeklyWatering,
      harvestDays: p.harvestDays,
      soilType: p.soilType,
      waterPerKg: p.waterPerKg,
      benefits: p.benefits,
      size: p.size,
    }));

    await this.plantRepository.createMany(plants);

    logger.info(`${plants.length} plantas cargadas en BD`);
  }

  private async seedCompatibilityMatrix(): Promise<void> {
    const matrixPath = path.join(__dirname, '../../../../data/matriz_compatibilities.json');

    if (!fs.existsSync(matrixPath)) {
      logger.warn(`Archivo no encontrado: ${matrixPath}`);
      return;
    }

    const matrixData = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

    const entries: CompatibilityEntry[] = [];

    Object.entries(matrixData).forEach(([plant1, compatibilities]) => {
      Object.entries(compatibilities as Record<string, number>).forEach(([plant2, score]) => {
        entries.push({
          plant1,
          plant2,
          score,
        });
      });
    });

    await this.compatibilityMatrixRepository.createMany(entries);

    logger.info(`${entries.length} entradas de compatibilidad cargadas en BD`);
  }
}
