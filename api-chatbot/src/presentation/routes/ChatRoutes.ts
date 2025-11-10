/**
 * Rutas de Chat
 */

import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

export class ChatRoutes {
  static create(chatController: ChatController): Router {
    const router = Router();

    // POST /chat/message - Enviar mensaje
    router.post('/message', (req, res) => chatController.sendMessage(req, res));

    // GET /chat/history/:sessionId - Obtener historial
    router.get('/history/:sessionId', (req, res) => chatController.getHistory(req, res));

    // GET /chat/health - Health check
    router.get('/health', (req, res) => chatController.health(req, res));

    return router;
  }
}
