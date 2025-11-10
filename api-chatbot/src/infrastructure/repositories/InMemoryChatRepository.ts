/**
 * Implementación en memoria del repositorio de chat
 * Para producción, considerar usar MongoDB o Redis
 */

import { ChatMessage } from '@domain/entities/ChatMessage';
import { ChatRepository } from '@domain/repositories/ChatRepository';

export class InMemoryChatRepository implements ChatRepository {
  private messages: Map<string, ChatMessage> = new Map();

  async save(message: ChatMessage): Promise<ChatMessage> {
    this.messages.set(message.id, message);
    return message;
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const sessionMessages: ChatMessage[] = [];

    for (const message of this.messages.values()) {
      if (message.sessionId === sessionId) {
        sessionMessages.push(message);
      }
    }

    // Ordenar por timestamp
    return sessionMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findLastMessages(sessionId: string, limit: number): Promise<ChatMessage[]> {
    const sessionMessages = await this.findBySessionId(sessionId);

    // Retornar los últimos N mensajes
    return sessionMessages.slice(-limit);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    let deleted = false;

    for (const [id, message] of this.messages.entries()) {
      if (message.sessionId === sessionId) {
        this.messages.delete(id);
        deleted = true;
      }
    }

    return deleted;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    let count = 0;

    for (const [id, message] of this.messages.entries()) {
      if (message.timestamp < date) {
        this.messages.delete(id);
        count++;
      }
    }

    return count;
  }

  async findAllSessions(): Promise<string[]> {
    const sessions = new Set<string>();

    for (const message of this.messages.values()) {
      sessions.add(message.sessionId);
    }

    return Array.from(sessions);
  }

  // Métodos auxiliares
  clear(): void {
    this.messages.clear();
  }

  size(): number {
    return this.messages.size;
  }
}
