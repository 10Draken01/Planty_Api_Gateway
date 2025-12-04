/**
 * Memory Controller
 * Expone endpoints para que api-chatbot interactúe con el sistema de memoria
 */

import { Request, Response } from 'express';
import { MemoryService } from '../../application/services/MemoryService';

export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  /**
   * GET /api/memory/user/:userId/context
   * Obtiene el contexto completo del usuario para el chatbot
   */
  async getUserContext(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const context = await this.memoryService.getUserContext(userId);

      res.json(context);
    } catch (error: any) {
      console.error('Error getting user context:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/memory/conversation/:sessionId/context
   * Obtiene el contexto de una conversación específica
   */
  async getConversationContext(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      const context = await this.memoryService.getConversationContext(sessionId);

      if (!context) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      res.json(context);
    } catch (error: any) {
      console.error('Error getting conversation context:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/memory/conversation/start
   * Inicia una nueva sesión de conversación
   * Body: { userId: string, sessionId?: string }
   */
  async startConversation(req: Request, res: Response): Promise<void> {
    try {
      const { userId, sessionId } = req.body;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const newSessionId = await this.memoryService.startConversation(userId, sessionId);

      res.json({ sessionId: newSessionId });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/memory/conversation/message
   * Guarda un mensaje en la conversación
   * Body: { sessionId: string, role: 'user' | 'assistant', content: string, metadata?: object }
   */
  async saveMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, role, content, metadata } = req.body;

      if (!sessionId || !role || !content) {
        res.status(400).json({ error: 'sessionId, role, and content are required' });
        return;
      }

      if (role !== 'user' && role !== 'assistant') {
        res.status(400).json({ error: 'role must be "user" or "assistant"' });
        return;
      }

      const message = await this.memoryService.saveMessage(
        sessionId,
        role,
        content,
        metadata
      );

      res.json({ success: true, message });
    } catch (error: any) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/memory/conversation/end
   * Finaliza una sesión de conversación
   * Body: { sessionId: string, satisfaction?: number }
   */
  async endConversation(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, satisfaction } = req.body;

      if (!sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      await this.memoryService.endConversation(sessionId, satisfaction);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error ending conversation:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/memory/user/extract
   * Extrae y guarda información del mensaje del usuario
   * Body: { userId: string, userMessage: string, conversationId: string, messageId: string }
   */
  async extractUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const { userId, userMessage, conversationId, messageId } = req.body;

      if (!userId || !userMessage || !conversationId || !messageId) {
        res.status(400).json({
          error: 'userId, userMessage, conversationId, and messageId are required'
        });
        return;
      }

      await this.memoryService.extractAndSaveUserInfo(
        userId,
        userMessage,
        conversationId,
        messageId
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error extracting user info:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/memory/user/:userId/stats
   * Obtiene estadísticas del usuario
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const stats = await this.memoryService.getUserStats(userId);

      res.json(stats);
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/memory/conversation/:sessionId/tags
   * Actualiza los tags de una conversación
   * Body: { tags: string[] }
   */
  async updateTags(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { tags } = req.body;

      if (!sessionId) {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      if (!Array.isArray(tags)) {
        res.status(400).json({ error: 'tags must be an array' });
        return;
      }

      await this.memoryService.updateConversationTags(sessionId, tags);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating tags:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/memory/user/:userId/history
   * Obtiene el historial de conversaciones del usuario
   * Query params: ?limit=10
   */
  async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const history = await this.memoryService.getUserConversationHistory(userId, limit);

      res.json(history);
    } catch (error: any) {
      console.error('Error getting user history:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
