/**
 * Cliente HTTP para comunicarse con api-users
 * Permite acceder a servicios de memoria desde api-chatbot
 */

import axios, { AxiosInstance } from 'axios';

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
  recentMessages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  tags: string[];
  messageCount: number;
}

export interface SaveMessageRequest {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    retrievedChunks?: Array<{
      chunkId: string;
      documentName: string;
      relevanceScore: number;
    }>;
    modelUsed: string;
    latencyMs?: number;
    ragEnabled: boolean;
  };
}

export class UsersServiceClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.USERS_SERVICE_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Obtener contexto del usuario
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      const response = await this.client.get(`/api/memory/user/${userId}/context`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`User context not found for userId: ${userId}`);
        return null;
      }
      console.error('Error getting user context:', error.message);
      throw error;
    }
  }

  /**
   * Obtener contexto de la conversación
   */
  async getConversationContext(sessionId: string): Promise<ConversationContext | null> {
    try {
      const response = await this.client.get(`/api/memory/conversation/${sessionId}/context`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Conversation context not found for sessionId: ${sessionId}`);
        return null;
      }
      console.error('Error getting conversation context:', error.message);
      throw error;
    }
  }

  /**
   * Iniciar nueva conversación
   */
  async startConversation(userId: string, sessionId?: string): Promise<string> {
    try {
      const response = await this.client.post('/api/memory/conversation/start', {
        userId,
        sessionId
      });
      return response.data.sessionId;
    } catch (error: any) {
      console.error('Error starting conversation:', error.message);
      throw error;
    }
  }

  /**
   * Guardar mensaje en la conversación
   */
  async saveMessage(request: SaveMessageRequest): Promise<void> {
    try {
      await this.client.post('/api/memory/conversation/message', request);
    } catch (error: any) {
      console.error('Error saving message:', error.message);
      throw error;
    }
  }

  /**
   * Extraer y guardar información del usuario
   */
  async extractUserInfo(
    userId: string,
    userMessage: string,
    conversationId: string,
    messageId: string
  ): Promise<void> {
    try {
      await this.client.post('/api/memory/user/extract', {
        userId,
        userMessage,
        conversationId,
        messageId
      });
    } catch (error: any) {
      console.error('Error extracting user info:', error.message);
      // No lanzar error, esta operación es opcional
    }
  }

  /**
   * Finalizar conversación
   */
  async endConversation(sessionId: string, satisfaction?: number): Promise<void> {
    try {
      await this.client.post('/api/memory/conversation/end', {
        sessionId,
        satisfaction
      });
    } catch (error: any) {
      console.error('Error ending conversation:', error.message);
      // No lanzar error, es una operación de cleanup
    }
  }

  /**
   * Actualizar tags de la conversación
   */
  async updateConversationTags(sessionId: string, tags: string[]): Promise<void> {
    try {
      await this.client.patch(`/api/memory/conversation/${sessionId}/tags`, { tags });
    } catch (error: any) {
      console.error('Error updating conversation tags:', error.message);
      // No lanzar error, es una operación opcional
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('Users service is not available');
      return false;
    }
  }

  /**
   * Obtener estadísticas del usuario
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/memory/user/${userId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting user stats:', error.message);
      return null;
    }
  }
}

/**
 * Factory para crear el cliente
 */
export function createUsersServiceClient(): UsersServiceClient {
  return new UsersServiceClient();
}
