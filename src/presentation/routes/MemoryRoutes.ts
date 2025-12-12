/**
 * Memory Routes
 * Define las rutas para los endpoints de memoria del chatbot
 */

import { Router } from 'express';
import { MemoryController } from '../controllers/MemoryController';

export class MemoryRoutes {
  /**
   * Crea el router con todas las rutas de memoria
   */
  static create(memoryController: MemoryController): Router {
    const router = Router();

    // GET endpoints
    router.get(
      '/user/:userId/context',
      (req, res) => memoryController.getUserContext(req, res)
    );

    router.get(
      '/conversation/:sessionId/context',
      (req, res) => memoryController.getConversationContext(req, res)
    );

    router.get(
      '/user/:userId/stats',
      (req, res) => memoryController.getUserStats(req, res)
    );

    router.get(
      '/user/:userId/history',
      (req, res) => memoryController.getUserHistory(req, res)
    );

    // POST endpoints
    router.post(
      '/conversation/start',
      (req, res) => memoryController.startConversation(req, res)
    );

    router.post(
      '/conversation/message',
      (req, res) => memoryController.saveMessage(req, res)
    );

    router.post(
      '/conversation/end',
      (req, res) => memoryController.endConversation(req, res)
    );

    router.post(
      '/user/extract',
      (req, res) => memoryController.extractUserInfo(req, res)
    );

    // PATCH endpoints
    router.patch(
      '/conversation/:sessionId/tags',
      (req, res) => memoryController.updateTags(req, res)
    );

    return router;
  }
}
