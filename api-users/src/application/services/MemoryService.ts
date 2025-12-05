/**
 * Servicio de Gestión de Memoria del Chatbot
 * Coordina la memoria conversacional, de usuario y de conocimiento
 */

import { ConversationRepository } from '../../domain/repositories/ConversationRepository';
import { UserMemoryRepository } from '../../domain/repositories/UserMemoryRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { Message } from '../../infrastructure/database/models/ConversationModel';

export interface UserContext {
  userId: string;
  name: string;
  experienceLevel: 1 | 2 | 3;
  favoritePlants: string[];
  interests: string[];
  responseStyle: 'concise' | 'detailed';
  activePlants: Array<{
    plantId: number;
    plantName: string;
    status: string;
  }>;
  commonProblems: Array<{
    problem: string;
    frequency: number;
  }>;
  recentFacts: string[];
}

export interface ConversationContext {
  sessionId: string;
  recentMessages: Message[];
  tags: string[];
  messageCount: number;
}

export class MemoryService {
  constructor(
    private conversationRepository: ConversationRepository,
    private userMemoryRepository: UserMemoryRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Obtener contexto completo del usuario para el chatbot
   */
  async getUserContext(userId: string): Promise<UserContext> {
    // Obtener perfil del usuario
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Obtener memoria del usuario
    const memory = await this.userMemoryRepository.findByUserId(userId);

    // Construir contexto
    const context: UserContext = {
      userId: user.id,
      name: user.name,
      experienceLevel: user.experience_level,
      favoritePlants: user.chatPreferences?.favoritePlants || [],
      interests: user.chatPreferences?.interests || [],
      responseStyle: user.chatPreferences?.responseStyle || 'detailed',
      activePlants: memory?.userPlants
        .filter(p => p.status === 'growing')
        .map(p => ({
          plantId: p.plantId,
          plantName: p.plantName,
          status: p.status
        })) || [],
      commonProblems: memory?.commonProblems
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(p => ({
          problem: p.problem,
          frequency: p.frequency
        })) || [],
      recentFacts: memory?.getActiveFacts()
        .slice(-5)
        .map(f => f.fact) || []
    };

    return context;
  }

  /**
   * Obtener contexto conversacional de la sesión actual
   */
  async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    const conversation = await this.conversationRepository.findBySessionId(sessionId);

    if (!conversation) {
      return null;
    }

    // CORRECCIÓN CRÍTICA: Si la conversación no tiene mensajes aún,
    // devolver null para evitar mostrar contexto de conversaciones inexistentes
    if (!conversation.messages || conversation.messages.length === 0) {
      console.log(`⚠️  Sesión ${sessionId} encontrada pero sin mensajes. Retornando null.`);
      return null;
    }

    return {
      sessionId: conversation.sessionId,
      recentMessages: conversation.getRecentMessages(10),
      tags: conversation.sessionMetadata.tags,
      messageCount: conversation.sessionMetadata.messageCount
    };
  }

  /**
   * Iniciar una nueva sesión de conversación
   */
  async startConversation(userId: string, sessionId?: string): Promise<string> {
    const conversation = await this.conversationRepository.create(userId, sessionId);

    // Actualizar métricas del usuario
    const user = await this.userRepository.findById(userId);

    if (user) {
      const chatMetrics = user.chatMetrics || {
        totalMessages: 0,
        totalSessions: 0,
        averageSessionDuration: 0
      };

      chatMetrics.totalSessions += 1;
      chatMetrics.lastActiveAt = new Date();

      // Actualizar usuario (necesitarías un método update en UserRepository)
      // await this.userRepository.update(user);
    }

    return conversation.sessionId;
  }

  /**
   * Guardar un mensaje en la conversación
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Message['metadata']
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findBySessionId(sessionId);

    if (!conversation) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message = await this.conversationRepository.addMessage(conversation._id, {
      role,
      content,
      metadata
    });

    // Si es mensaje del usuario, actualizar métricas
    if (role === 'user') {
      const user = await this.userRepository.findById(conversation.userId);

      if (user && user.chatMetrics) {
        user.chatMetrics.totalMessages += 1;
        user.chatMetrics.lastActiveAt = new Date();
        // await this.userRepository.update(user);
      }
    }

    return message;
  }

  /**
   * Finalizar una sesión
   */
  async endConversation(sessionId: string, satisfaction?: number): Promise<void> {
    const conversation = await this.conversationRepository.findBySessionId(sessionId);

    if (!conversation) {
      return;
    }

    await this.conversationRepository.endSession(conversation._id, satisfaction);

    // Actualizar duración promedio del usuario
    const avgDuration = await this.conversationRepository.getAverageSessionDuration(
      conversation.userId
    );

    const user = await this.userRepository.findById(conversation.userId);

    if (user && user.chatMetrics) {
      user.chatMetrics.averageSessionDuration = avgDuration;

      if (satisfaction) {
        const currentScore = user.chatMetrics.satisfactionScore || 0;
        const totalSessions = user.chatMetrics.totalSessions;

        // Promedio ponderado
        user.chatMetrics.satisfactionScore =
          (currentScore * (totalSessions - 1) + satisfaction) / totalSessions;
      }

      // await this.userRepository.update(user);
    }
  }

  /**
   * Extraer y guardar información del mensaje del usuario
   */
  async extractAndSaveUserInfo(
    userId: string,
    userMessage: string,
    conversationId: string,
    messageId: string
  ): Promise<void> {
    // Aquí podrías implementar lógica de NER (Named Entity Recognition)
    // Por ahora, implementaremos reglas simples

    const timestamp = new Date();

    // Detectar menciones de plantas (regex simple)
    const plantMentions = this.extractPlantMentions(userMessage);

    for (const plantName of plantMentions) {
      // Asumiendo que tienes una forma de obtener el plantId
      // Por ahora usaremos 0 como placeholder
      await this.userMemoryRepository.addOrUpdatePlant(
        userId,
        0, // Necesitarías buscar el ID real
        plantName,
        'growing',
        `Mencionado en conversación`
      );
    }

    // Detectar problemas (palabras clave)
    const problemKeywords = ['plaga', 'enfermedad', 'hojas amarillas', 'marchita', 'problema'];
    const hasProblem = problemKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (hasProblem) {
      await this.userMemoryRepository.addOrUpdateProblem(
        userId,
        userMessage.substring(0, 100), // Primeras 100 chars como descripción
        undefined
      );
    }

    // Detectar preferencias
    const preferenceKeywords = ['me gusta', 'prefiero', 'quiero', 'deseo'];
    const hasPreference = preferenceKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (hasPreference) {
      await this.userMemoryRepository.addFact(
        userId,
        userMessage.substring(0, 200),
        'preference',
        {
          conversationId,
          messageId,
          timestamp
        },
        0.7
      );
    }
  }

  /**
   * Extraer menciones de plantas del mensaje (regex simple)
   */
  private extractPlantMentions(message: string): string[] {
    const commonPlants = [
      'tomate',
      'lechuga',
      'albahaca',
      'cilantro',
      'perejil',
      'zanahoria',
      'cebolla',
      'ajo',
      'chile',
      'calabaza',
      'pepino',
      'espinaca',
      'rábano'
    ];

    const mentions: string[] = [];
    const lowerMessage = message.toLowerCase();

    for (const plant of commonPlants) {
      if (lowerMessage.includes(plant)) {
        mentions.push(plant);
      }
    }

    return mentions;
  }

  /**
   * Actualizar tags de la conversación basado en el contenido
   */
  async updateConversationTags(sessionId: string, newTags: string[]): Promise<void> {
    const conversation = await this.conversationRepository.findBySessionId(sessionId);

    if (!conversation) {
      return;
    }

    const existingTags = conversation.sessionMetadata.tags;
    const uniqueTags = Array.from(new Set([...existingTags, ...newTags]));

    await this.conversationRepository.updateTags(conversation._id, uniqueTags);
  }

  /**
   * Obtener historial de conversaciones del usuario
   */
  async getUserConversationHistory(userId: string, limit: number = 10) {
    return await this.conversationRepository.findByUserId(userId, limit);
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId: string) {
    const user = await this.userRepository.findById(userId);
    const totalConversations = await this.conversationRepository.countByUserId(userId);
    const totalMessages = await this.conversationRepository.getTotalMessagesByUserId(userId);
    const memory = await this.userMemoryRepository.findByUserId(userId);

    return {
      user: {
        name: user?.name,
        experienceLevel: user?.experience_level
      },
      conversations: {
        total: totalConversations,
        totalMessages,
        averageDuration: user?.chatMetrics?.averageSessionDuration || 0,
        satisfactionScore: user?.chatMetrics?.satisfactionScore
      },
      memory: {
        totalFacts: memory?.facts.filter(f => f.isActive).length || 0,
        totalPlants: memory?.userPlants.length || 0,
        totalProblems: memory?.commonProblems.length || 0
      }
    };
  }
}
