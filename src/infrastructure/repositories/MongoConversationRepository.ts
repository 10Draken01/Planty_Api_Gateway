/**
 * Implementación MongoDB del repositorio de Conversaciones
 */

import { ConversationRepository } from '../../domain/repositories/ConversationRepository';
import { ConversationModel, ConversationDocument, Message } from '../database/models/ConversationModel';

export class MongoConversationRepository implements ConversationRepository {
  async create(userId: string, sessionId?: string): Promise<ConversationDocument> {
    const conversation = ConversationModel.createNew(userId, sessionId);
    return await conversation.save();
  }

  async findById(conversationId: string): Promise<ConversationDocument | null> {
    return await ConversationModel.findOne({ _id: conversationId });
  }

  async findBySessionId(sessionId: string): Promise<ConversationDocument | null> {
    return await ConversationModel.findOne({ sessionId, isActive: true });
  }

  async findByUserId(userId: string, limit: number = 10): Promise<ConversationDocument[]> {
    return await ConversationModel.find({ userId })
      .sort({ 'sessionMetadata.lastMessageAt': -1 })
      .limit(limit);
  }

  async findActiveByUserId(userId: string): Promise<ConversationDocument[]> {
    return await ConversationModel.find({ userId, isActive: true })
      .sort({ 'sessionMetadata.lastMessageAt': -1 });
  }

  async addMessage(
    conversationId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<Message> {
    const conversation = await ConversationModel.findOne({ _id: conversationId });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage = conversation.addMessage(message);
    await conversation.save();

    return newMessage;
  }

  async getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
    const conversation = await ConversationModel.findOne({ _id: conversationId });

    if (!conversation) {
      return [];
    }

    return conversation.getRecentMessages(limit);
  }

  async endSession(conversationId: string, satisfaction?: number): Promise<boolean> {
    const conversation = await ConversationModel.findOne({ _id: conversationId });

    if (!conversation) {
      return false;
    }

    conversation.endSession(satisfaction);
    await conversation.save();

    return true;
  }

  async updateTags(conversationId: string, tags: string[]): Promise<boolean> {
    const result = await ConversationModel.updateOne(
      { _id: conversationId },
      { $set: { 'sessionMetadata.tags': tags } }
    );

    return result.modifiedCount > 0;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await ConversationModel.deleteMany({
      'sessionMetadata.lastMessageAt': { $lt: date }
    });

    return result.deletedCount || 0;
  }

  async countByUserId(userId: string): Promise<number> {
    return await ConversationModel.countDocuments({ userId });
  }

  /**
   * Métodos auxiliares para estadísticas
   */
  async getAverageSessionDuration(userId: string): Promise<number> {
    const conversations = await ConversationModel.find({ userId, isActive: false });

    if (conversations.length === 0) return 0;

    const totalDuration = conversations.reduce((sum, conv) => {
      if (conv.endedAt) {
        const duration = conv.endedAt.getTime() - conv.sessionMetadata.startedAt.getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

    return totalDuration / conversations.length / 1000; // Retornar en segundos
  }

  async getTotalMessagesByUserId(userId: string): Promise<number> {
    const conversations = await ConversationModel.find({ userId });

    return conversations.reduce((sum, conv) => sum + conv.sessionMetadata.messageCount, 0);
  }
}
