/**
 * Repositorio de Conversaciones - Interfaz del dominio
 */

import { ConversationDocument, Message } from '../../infrastructure/database/models/ConversationModel';

export interface ConversationRepository {
  /**
   * Crear una nueva conversación
   */
  create(userId: string, sessionId?: string): Promise<ConversationDocument>;

  /**
   * Encontrar conversación por ID
   */
  findById(conversationId: string): Promise<ConversationDocument | null>;

  /**
   * Encontrar conversación activa por sessionId
   */
  findBySessionId(sessionId: string): Promise<ConversationDocument | null>;

  /**
   * Encontrar todas las conversaciones de un usuario
   */
  findByUserId(userId: string, limit?: number): Promise<ConversationDocument[]>;

  /**
   * Encontrar conversaciones activas de un usuario
   */
  findActiveByUserId(userId: string): Promise<ConversationDocument[]>;

  /**
   * Agregar un mensaje a una conversación
   */
  addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message>;

  /**
   * Obtener mensajes recientes de una conversación
   */
  getRecentMessages(conversationId: string, limit: number): Promise<Message[]>;

  /**
   * Finalizar una sesión
   */
  endSession(conversationId: string, satisfaction?: number): Promise<boolean>;

  /**
   * Actualizar tags de una conversación
   */
  updateTags(conversationId: string, tags: string[]): Promise<boolean>;

  /**
   * Eliminar conversaciones antiguas (admin)
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Contar conversaciones de un usuario
   */
  countByUserId(userId: string): Promise<number>;
}
