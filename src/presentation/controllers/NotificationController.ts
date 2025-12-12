import { Request, Response } from 'express';
import { SendNotificationToUserUseCase } from '../../application/use-cases/SendNotificationToUserUseCase';
import { SendNotificationToMultipleUsersUseCase } from '../../application/use-cases/SendNotificationToMultipleUsersUseCase';
import { BroadcastNotificationUseCase } from '../../application/use-cases/BroadcastNotificationUseCase';
import { logger } from '../../infrastructure/services/LoggerService';

export class NotificationController {
  constructor(
    private sendNotificationToUserUseCase: SendNotificationToUserUseCase,
    private sendNotificationToMultipleUsersUseCase: SendNotificationToMultipleUsersUseCase,
    private broadcastNotificationUseCase: BroadcastNotificationUseCase
  ) {}

  /**
   * POST /notify/user/:id
   * Envía una notificación a un usuario específico
   */
  async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, body, data, imageUrl } = req.body;

      // Validaciones
      if (!title || !body) {
        res.status(400).json({
          success: false,
          message: 'Los campos title y body son obligatorios',
        });
        return;
      }

      // Ejecutar caso de uso
      const result = await this.sendNotificationToUserUseCase.execute({
        userId: id,
        title,
        body,
        data,
        imageUrl,
      });

      // Responder según el resultado
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error: any) {
      logger.error('Error en NotificationController.sendToUser', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }

  /**
   * POST /notify/users
   * Envía notificaciones a múltiples usuarios
   */
  async sendToMultipleUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, title, body, data, imageUrl } = req.body;

      // Validaciones
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'El campo userIds debe ser un array con al menos un ID',
        });
        return;
      }

      if (!title || !body) {
        res.status(400).json({
          success: false,
          message: 'Los campos title y body son obligatorios',
        });
        return;
      }

      // Ejecutar caso de uso
      const result = await this.sendNotificationToMultipleUsersUseCase.execute({
        userIds,
        title,
        body,
        data,
        imageUrl,
      });

      // Responder según el resultado
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error: any) {
      logger.error('Error en NotificationController.sendToMultipleUsers', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }

  /**
   * POST /notify/broadcast
   * Envía una notificación a TODOS los usuarios con tokenFCM
   */
  async broadcast(req: Request, res: Response): Promise<void> {
    try {
      const { title, body, data, imageUrl } = req.body;

      // Validaciones
      if (!title || !body) {
        res.status(400).json({
          success: false,
          message: 'Los campos title y body son obligatorios',
        });
        return;
      }

      // Ejecutar caso de uso
      const result = await this.broadcastNotificationUseCase.execute({
        title,
        body,
        data,
        imageUrl,
      });

      // Responder según el resultado
      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error: any) {
      logger.error('Error en NotificationController.broadcast', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
      });
    }
  }

  /**
   * GET /health
   * Health check del servicio
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'notifications-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
