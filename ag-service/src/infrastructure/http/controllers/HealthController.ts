import { Request, Response } from 'express';
import { PlantRepository } from '../../../domain/repositories/PlantRepository';
import { CompatibilityMatrixRepository } from '../../../domain/repositories/CompatibilityMatrixRepository';
import { mongoConnection } from '../../persistence/mongodb/connection';

export class HealthController {
  constructor(
    private plantRepository: PlantRepository,
    private compatibilityMatrixRepository: CompatibilityMatrixRepository
  ) {}

  async handle(_req: Request, res: Response): Promise<void> {
    try {
      const dbConnected = mongoConnection.isConnectionReady();

      let collections = { plants: 0, matrix: 0 };

      if (dbConnected) {
        collections.plants = await this.plantRepository.count();
        collections.matrix = await this.compatibilityMatrixRepository.count();
      }

      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        dbConnected,
        collections,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error.message,
      });
    }
  }
}
