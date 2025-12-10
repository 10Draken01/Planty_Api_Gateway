import { Request, Response } from 'express';
import { SeedOrchardsUseCase } from '@application/use-cases/SeedOrchardsUseCase';

export class SeedController {
  constructor(private seedOrchardsUseCase: SeedOrchardsUseCase) {}

  /**
   * POST /orchards/seed
   * Genera huertos para todos los usuarios existentes
   *
   * Query params:
   * - batchSize: tamaño de lote para obtener usuarios (default: 100)
   * - usersServiceUrl: URL del servicio de usuarios (default: http://localhost:3001/api/users)
   * - agServiceUrl: URL del servicio AG (default: http://localhost:3005/v1)
   */
  async seedOrchards(req: Request, res: Response): Promise<void> {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 100;
      const usersServiceUrl = (req.query.usersServiceUrl as string) || 'http://localhost:3001/api';
      const agServiceUrl = (req.query.agServiceUrl as string) || 'http://localhost:3005/v1';

      // Validaciones
      if (batchSize <= 0 || batchSize > 1000) {
        res.status(400).json({
          success: false,
          message: 'El batchSize debe estar entre 1 y 1,000',
          status: 400
        });
        return;
      }

      console.log(`🌱 Iniciando seed de huertos...`);
      console.log(`📦 Tamaño de lote: ${batchSize}`);
      console.log(`👥 URL usuarios: ${usersServiceUrl}`);
      console.log(`🧬 URL AG: ${agServiceUrl}`);

      // Ejecutar seed con callback de progreso
      const result = await this.seedOrchardsUseCase.execute({
        batchSize,
        usersServiceUrl,
        agServiceUrl,
        onProgress: (progress) => {
          // Log en consola
          console.log(
            `📊 Progreso: ${progress.processedUsers} usuarios procesados - ` +
            `${progress.orchardsCreated} huertos creados - ` +
            `Lote ${progress.currentBatch} - Errores: ${progress.errors}`
          );
        }
      });

      // Respuesta final
      res.status(200).json({
        success: true,
        message: `Seed de huertos completado exitosamente`,
        status: 200,
        data: {
          totalUsersProcessed: result.totalUsersProcessed,
          totalOrchardsCreated: result.totalOrchardsCreated,
          executionTimeMs: result.executionTimeMs,
          executionTimeMinutes: Math.round(result.executionTimeMs / 1000 / 60 * 100) / 100,
          averageTimePerUser: Math.round(result.executionTimeMs / result.totalUsersProcessed * 100) / 100,
          errors: result.errors.slice(0, 10) // Primeros 10 errores
        }
      });

    } catch (error: any) {
      console.error('❌ Error durante seed de huertos:', error);

      res.status(500).json({
        success: false,
        message: 'Error durante el seed de huertos',
        error: error.message,
        status: 500
      });
    }
  }
}
