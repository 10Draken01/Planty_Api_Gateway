/**
 * Controlador de Plants
 * Maneja las peticiones HTTP relacionadas con plantas
 */

import { Request, Response } from 'express';
import { ListPlantsUseCase } from '@application/use-cases/ListPlantsUseCase';

export class PlantController {
  constructor(
    private listPlantsUseCase: ListPlantsUseCase
  ) {}

  /**
   * GET /plants
   * Listar todas las plantas
   */
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.listPlantsUseCase.execute();

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al listar plantas:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar plantas'
      });
    }
  }

  /**
   * GET /plants/health
   * Health check del controlador
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'plant-controller',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }
}
