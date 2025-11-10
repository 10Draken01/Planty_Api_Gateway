/**
 * Controlador de Chat
 */

import { Request, Response } from 'express';
import { SendMessageUseCase } from '@application/use-cases/SendMessageUseCase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistoryUseCase';

export class ChatController {
  constructor(
    private sendMessageUseCase: SendMessageUseCase,
    private getChatHistoryUseCase: GetChatHistoryUseCase
  ) {}

  /**
   * POST /chat/message
   * Envía un mensaje al chatbot
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, includeContext = true, maxContextChunks = 5 } = req.body;

      // Validaciones
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El campo "message" es requerido y debe ser un texto válido'
        });
        return;
      }

      // Ejecutar use case - retorna solo el mensaje de respuesta
      const response = await this.sendMessageUseCase.execute({
        message: message.trim(),
        includeContext,
        maxContextChunks
      });

      // Retornar solo la respuesta generada
      res.status(200).json({
        success: true,
        response: response
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
