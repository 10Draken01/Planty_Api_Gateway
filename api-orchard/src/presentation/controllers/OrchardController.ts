/**
 * Controlador de Orchards (ACTUALIZADO)
 * Maneja las peticiones HTTP relacionadas con huertos
 *
 * NUEVOS ENDPOINTS:
 * - POST /orchards/:id/plants/layout - Agregar planta con posición al layout
 * - PATCH /orchards/:id/plants/layout/:plantInstanceId/move - Mover planta
 * - DELETE /orchards/:id/plants/layout/:plantInstanceId - Remover planta del layout
 */

import { Request, Response } from 'express';
import { CreateOrchardUseCase } from '@application/use-cases/CreateOrchardUseCase';
import { GetOrchardUseCase } from '@application/use-cases/GetOrchardUseCase';
import { ListOrchardsUseCase } from '@application/use-cases/ListOrchardsUseCase';
import { GetOrchardsByUserUseCase } from '@application/use-cases/GetOrchardsByUserUseCase';
import { UpdateOrchardUseCase } from '@application/use-cases/UpdateOrchardUseCase';
import { DeleteOrchardUseCase } from '@application/use-cases/DeleteOrchardUseCase';
import { ToggleOrchardStateUseCase } from '@application/use-cases/ToggleOrchardStateUseCase';
import { AddPlantToOrchardLayoutUseCase } from '@application/use-cases/AddPlantToOrchardLayoutUseCase';
import { MovePlantInLayoutUseCase } from '@application/use-cases/MovePlantInLayoutUseCase';
import { RemovePlantFromLayoutUseCase } from '@application/use-cases/RemovePlantFromLayoutUseCase';

export class OrchardController {
  constructor(
    private createOrchardUseCase: CreateOrchardUseCase,
    private getOrchardUseCase: GetOrchardUseCase,
    private listOrchardsUseCase: ListOrchardsUseCase,
    private getOrchardsByUserUseCase: GetOrchardsByUserUseCase,
    private updateOrchardUseCase: UpdateOrchardUseCase,
    private deleteOrchardUseCase: DeleteOrchardUseCase,
    private toggleOrchardStateUseCase: ToggleOrchardStateUseCase,
    private addPlantToLayoutUseCase: AddPlantToOrchardLayoutUseCase,
    private movePlantInLayoutUseCase: MovePlantInLayoutUseCase,
    private removePlantFromLayoutUseCase: RemovePlantFromLayoutUseCase
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
   * GET /orchards/user/:userId
   * Obtener todos los huertos de un usuario específico
   */
  async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await this.getOrchardsByUserUseCase.execute(userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al obtener huertos del usuario:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener huertos del usuario'
      });
    }
  }

  /**
   * PUT /orchards/:id
   * Actualizar un huerto (solo name y description)
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

  // ==================== ✅ NUEVOS MÉTODOS PARA LAYOUT ====================

  /**
   * POST /orchards/:id/plants/layout
   * Agregar una planta con posición al layout del huerto
   *
   * Body: {
   *   plantId: number,
   *   x: number,
   *   y: number,
   *   width?: number,
   *   height?: number,
   *   rotation?: number
   * }
   */
  async addPlantToLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { plantId, x, y, width, height, rotation } = req.body;

      // Validaciones de entrada
      if (!plantId) {
        res.status(400).json({
          success: false,
          error: 'El campo plantId es requerido'
        });
        return;
      }

      if (x === undefined || y === undefined) {
        res.status(400).json({
          success: false,
          error: 'Los campos x e y son requeridos'
        });
        return;
      }

      const result = await this.addPlantToLayoutUseCase.execute({
        orchardId: id,
        plantId,
        x,
        y,
        width,
        height,
        rotation
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.plantInstance
      });
    } catch (error) {
      console.error('Error al agregar planta al layout:', error);

      // Determinar código de estado según el tipo de error
      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message.includes('no encontrado')) {
          statusCode = 404;
        } else if (
          error.message.includes('colisiona') ||
          error.message.includes('fuera de los límites')
        ) {
          statusCode = 409; // Conflict
        }
      }

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al agregar planta al layout'
      });
    }
  }

  /**
   * PATCH /orchards/:id/plants/layout/:plantInstanceId/move
   * Mover una planta a una nueva posición en el layout
   *
   * Body: {
   *   newX: number,
   *   newY: number
   * }
   */
  async movePlantInLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id, plantInstanceId } = req.params;
      const { newX, newY } = req.body;

      // Validaciones de entrada
      if (newX === undefined || newY === undefined) {
        res.status(400).json({
          success: false,
          error: 'Los campos newX y newY son requeridos'
        });
        return;
      }

      const result = await this.movePlantInLayoutUseCase.execute({
        orchardId: id,
        plantInstanceId,
        newX,
        newY
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          plantInstanceId: result.plantInstanceId,
          newPosition: result.newPosition
        }
      });
    } catch (error) {
      console.error('Error al mover planta en layout:', error);

      let statusCode = 400;
      if (error instanceof Error) {
        if (error.message.includes('no encontrado') || error.message.includes('no existe')) {
          statusCode = 404;
        } else if (
          error.message.includes('colisiona') ||
          error.message.includes('fuera de los límites')
        ) {
          statusCode = 409; // Conflict
        }
      }

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al mover planta en layout'
      });
    }
  }

  /**
   * DELETE /orchards/:id/plants/layout/:plantInstanceId
   * Remover una planta del layout del huerto
   */
  async removePlantFromLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id, plantInstanceId } = req.params;

      const result = await this.removePlantFromLayoutUseCase.execute({
        orchardId: id,
        plantInstanceId
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          plantInstanceId: result.plantInstanceId,
          countPlants: result.countPlants
        }
      });
    } catch (error) {
      console.error('Error al remover planta del layout:', error);

      const statusCode = error instanceof Error &&
        (error.message.includes('no encontrado') || error.message.includes('no existe'))
        ? 404
        : 400;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al remover planta del layout'
      });
    }
  }

  // ==================== HEALTH CHECK ====================

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
