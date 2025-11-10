/**
 * Use Case: Obtener historial de chat
 */

import { ChatRepository } from '@domain/repositories/ChatRepository';
import { ChatHistoryDTO } from '../dtos/ChatDTOs';

export class GetChatHistoryUseCase {
  constructor(private chatRepository: ChatRepository) {}

  async execute(sessionId: string): Promise<ChatHistoryDTO> {
    const messages = await this.chatRepository.findBySessionId(sessionId);

    return {
      sessionId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };
  }
}
