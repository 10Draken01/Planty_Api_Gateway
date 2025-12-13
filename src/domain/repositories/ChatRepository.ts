/**
 * Repositorio de Chat - Define el contrato para operaciones de chat
 */

import { ChatMessage } from '../entities/ChatMessage';

export interface ChatRepository {
  /**
   * Guarda un mensaje de chat
   */
  save(message: ChatMessage): Promise<ChatMessage>;

  /**
   * Obtiene todos los mensajes de una sesión
   */
  findBySessionId(sessionId: string): Promise<ChatMessage[]>;

  /**
   * Obtiene los últimos N mensajes de una sesión
   */
  findLastMessages(sessionId: string, limit: number): Promise<ChatMessage[]>;

  /**
   * Elimina todos los mensajes de una sesión
   */
  deleteSession(sessionId: string): Promise<boolean>;

  /**
   * Elimina mensajes más antiguos que una fecha
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Lista todas las sesiones únicas
   */
  findAllSessions(): Promise<string[]>;
}
