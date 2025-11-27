import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

export class NotificationRoutes {
  static create(notificationController: NotificationController): Router {
    const router = Router();

    // Health check
    router.get('/health', (req, res) => notificationController.health(req, res));

    // Enviar notificación a un usuario
    router.post('/user/:id', (req, res) => notificationController.sendToUser(req, res));

    // Enviar notificaciones a múltiples usuarios
    router.post('/users', (req, res) => notificationController.sendToMultipleUsers(req, res));

    // Broadcast a todos los usuarios
    router.post('/broadcast', (req, res) => notificationController.broadcast(req, res));

    return router;
  }
}
