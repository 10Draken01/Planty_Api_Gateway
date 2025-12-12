import { Request, Response } from 'express';
import { GenerateGardenUseCase } from '../../../application/use-cases/GenerateGardenUseCase';
import { generateGardenRequestSchema } from '../../../application/dtos/GenerateGardenRequestDto';
import { logger } from '../../../config/logger';

export class GenerateController {
  constructor(private generateGardenUseCase: GenerateGardenUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Validar request
      const { error, value } = generateGardenRequestSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      // Ejecutar caso de uso
      const result = await this.generateGardenUseCase.execute(value);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error en GenerateController', { error: error.message, stack: error.stack });

      res.status(500).json({
        success: false,
        message: 'Error generando huerto',
        error: error.message,
      });
    }
  }
}
