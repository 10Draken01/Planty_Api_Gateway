import { Request, Response } from 'express';
import { SeedUsersUseCase } from '../../application/use-cases/SeedUsersUseCase';

export class SeedController {
  constructor(private seedUsersUseCase: SeedUsersUseCase) {}

  /**
   * POST /api/users/seed
   * Genera y guarda 100,000 usuarios realistas para clustering
   *
   * Query params:
   * - total: número de usuarios a generar (default: 100000)
   * - batchSize: tamaño de lote (default: 1000)
   * - clearExisting: limpiar usuarios existentes (default: false)
   */
  async seedUsers(req: Request, res: Response): Promise<void> {
    try {
      const total = parseInt(req.query.total as string) || 100000;
      const batchSize = parseInt(req.query.batchSize as string) || 1000;
      const clearExisting = req.query.clearExisting === 'true';

      // Validaciones
      if (total <= 0 || total > 200000) {
        res.status(400).json({
          success: false,
          message: 'El total debe estar entre 1 y 200,000',
          status: 400
        });
        return;
      }

      if (batchSize <= 0 || batchSize > 5000) {
        res.status(400).json({
          success: false,
          message: 'El batchSize debe estar entre 1 y 5,000',
          status: 400
        });
        return;
      }

      // Enviar respuesta inmediata con header de streaming
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');

      console.log(`🌱 Iniciando seed de ${total} usuarios...`);

      // Ejecutar seed con callback de progreso
      const result = await this.seedUsersUseCase.execute({
        totalUsers: total,
        batchSize,
        clearExisting,
        onProgress: (progress) => {
          // Log en consola
          console.log(
            `📊 Progreso: ${progress.created}/${progress.total} ` +
            `(${Math.round((progress.created / progress.total) * 100)}%) - ` +
            `Lote ${progress.currentBatch} - Errores: ${progress.errors}`
          );
        }
      });

      // Respuesta final
      res.status(200).json({
        success: true,
        message: `Seed completado exitosamente`,
        status: 200,
        data: {
          totalCreated: result.totalCreated,
          totalErrors: result.totalErrors,
          executionTimeMs: result.executionTimeMs,
          executionTimeMinutes: Math.round(result.executionTimeMs / 1000 / 60 * 100) / 100,
          averageTimePerUser: Math.round(result.executionTimeMs / result.totalCreated * 100) / 100,
          errors: result.errors.slice(0, 10) // Primeros 10 errores
        }
      });

    } catch (error: any) {
      console.error('❌ Error durante seed:', error);

      res.status(500).json({
        success: false,
        message: 'Error durante el seed de usuarios',
        error: error.message,
        status: 500
      });
    }
  }
}
