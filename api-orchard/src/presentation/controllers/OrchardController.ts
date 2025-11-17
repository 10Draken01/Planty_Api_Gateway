/**
 * Controlador de Orchards
 * Maneja las peticiones HTTP relacionadas con huertos
 */

import { Request, Response } from 'express';
import { CreateOrchardUseCase } from '@application/use-cases/CreateOrchardUseCase';
import { GetOrchardUseCase } from '@application/use-cases/GetOrchardUseCase';
import { ListOrchardsUseCase } from '@application/use-cases/ListOrchardsUseCase';
import { UpdateOrchardUseCase } from '@application/use-cases/UpdateOrchardUseCase';
import { DeleteOrchardUseCase } from '@application/use-cases/DeleteOrchardUseCase';
import { ToggleOrchardStateUseCase } from '@application/use-cases/ToggleOrchardStateUseCase';
import { ManagePlantsUseCase } from '@application/use-cases/ManagePlantsUseCase';

export class OrchardController {
  constructor(
    private createOrchardUseCase: CreateOrchardUseCase,
    private getOrchardUseCase: GetOrchardUseCase,
    private listOrchardsUseCase: ListOrchardsUseCase,
    private updateOrchardUseCase: UpdateOrchardUseCase,
    private deleteOrchardUseCase: DeleteOrchardUseCase,
    private toggleOrchardStateUseCase: ToggleOrchardStateUseCase,
    private managePlantsUseCase: ManagePlantsUseCase
  ) {}

  /**
   * POST /orchards
   * Crear un nuevo huerto
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.createOrchardUseCase.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Huerto creado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al crear huerto:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear huerto'
      });
    }
  }

  /**
   * GET /orchards/:id
   * Obtener un huerto por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.getOrchardUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al obtener huerto:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener huerto'
      });
    }
  }

  /**
   * GET /orchards
   * Listar todos los huertos
   * Query params: ?active=true/false (opcional)
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const activeParam = req.query.active;
      let activeOnly: boolean | undefined = undefined;

      if (activeParam === 'true') {
        activeOnly = true;
      } else if (activeParam === 'false') {
        activeOnly = false;
      }

      const result = await this.listOrchardsUseCase.execute(activeOnly);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al listar huertos:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar huertos'
      });
    }
  }

  /**
   * PUT /orchards/:id
   * Actualizar un huerto
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.updateOrchardUseCase.execute(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Huerto actualizado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al actualizar huerto:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar huerto'
      });
    }
  }

  /**
   * DELETE /orchards/:id
   * Eliminar un huerto
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteOrchardUseCase.execute(id);

      res.status(200).json({
        success: true,
        message: 'Huerto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar huerto:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar huerto'
      });
    }
  }

  /**
   * PATCH /orchards/:id/activate
   * Activar un huerto
   */
  async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.toggleOrchardStateUseCase.execute(id, true);

      res.status(200).json({
        success: true,
        message: 'Huerto activado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al activar huerto:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al activar huerto'
      });
    }
  }

  /**
   * PATCH /orchards/:id/deactivate
   * Desactivar un huerto
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.toggleOrchardStateUseCase.execute(id, false);

      res.status(200).json({
        success: true,
        message: 'Huerto desactivado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al desactivar huerto:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al desactivar huerto'
      });
    }
  }

  /**
   * POST /orchards/:id/plants
   * Agregar una planta al huerto
   */
  async addPlant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { plantId } = req.body;

      const result = await this.managePlantsUseCase.addPlant(id, plantId);

      res.status(200).json({
        success: true,
        message: 'Planta agregada exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al agregar planta:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al agregar planta'
      });
    }
  }

  /**
   * DELETE /orchards/:id/plants/:plantId
   * Remover una planta del huerto
   */
  async removePlant(req: Request, res: Response): Promise<void> {
    try {
      const { id, plantId } = req.params;

      const result = await this.managePlantsUseCase.removePlant(id, plantId);

      res.status(200).json({
        success: true,
        message: 'Planta removida exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error al remover planta:', error);
      const statusCode = error instanceof Error && error.message === 'Huerto no encontrado' ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al remover planta'
      });
    }
  }

  /**
   * GET /orchards/health
   * Health check del controlador
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'orchard-controller',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }
}
