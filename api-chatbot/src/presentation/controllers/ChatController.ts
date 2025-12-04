/**
 * Controlador de Chat
 */

import { Request, Response } from 'express';
import { SendMessageWithMemoryUseCase } from '@application/use-cases/SendMessageWithMemoryUseCase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistoryUseCase';

export class ChatController {
  constructor(
    private sendMessageUseCase: SendMessageWithMemoryUseCase,
    private getChatHistoryUseCase: GetChatHistoryUseCase
  ) {}

  /**
   * POST /chat/message
   * Envía un mensaje al chatbot con memoria híbrida
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        sessionId,
        message,
        includeContext = true,
        maxContextChunks = 5
      } = req.body;

      // Validaciones
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El campo "userId" es requerido y debe ser un texto válido'
        });
        return;
      }

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El campo "message" es requerido y debe ser un texto válido'
        });
        return;
      }

      // Ejecutar use case con memoria - ahora incluye userId y sessionId
      const response = await this.sendMessageUseCase.execute({
        userId: userId.trim(),
        sessionId: sessionId?.trim(), // Opcional
        message: message.trim(),
        includeContext,
        maxContextChunks
      });

      // Retornar respuesta con sessionId para continuar conversación
      res.status(200).json({
        success: true,
        response: response.response,
        sessionId: response.sessionId
      });
    } catch (error) {
      console.error('Error en sendMessage:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el mensaje'
      });
    }
  }

  /**
   * GET /chat/history/:sessionId
   * Obtiene el historial de una sesión
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'El sessionId es requerido'
        });
        return;
      }

      const result = await this.getChatHistoryUseCase.execute(sessionId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error en getHistory:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener historial'
      });
    }
  }

  /**
   * GET /chat/health
   * Health check del servicio de chat
   */
  async health(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'chatbot',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  }
}
