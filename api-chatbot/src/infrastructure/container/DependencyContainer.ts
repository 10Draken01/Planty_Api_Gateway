/**
 * Contenedor de Inyección de Dependencias CON MEMORIA
 * Versión mejorada que incluye servicios de memoria e integración con api-users
 */

import { Router } from 'express';

// Repositories
import { InMemoryDocumentRepository } from '../repositories/InMemoryDocumentRepository';
import { InMemoryChatRepository } from '../repositories/InMemoryChatRepository';
import { ChromaVectorRepository } from '../database/ChromaVectorRepository';

// Services
import { PDFService } from '../services/PDFService';
import { TextSplitterService } from '../services/TextSplitterService';
import { OllamaChatService } from '../services/OllamaChatService';
import { OllamaService } from '../services/OllamaService';

// 🆕 NUEVOS SERVICIOS CON MEMORIA
import { CachedOllamaEmbeddingService } from '../services/CachedOllamaEmbeddingService';
import { UsersServiceClient } from '../external/UsersServiceClient';

// Use Cases
import { UploadDocumentUseCase } from '@application/use-cases/UploadDocumentUseCase';
import { ProcessDocumentUseCase } from '@application/use-cases/ProcessDocumentUseCase';
import { GetDocumentsUseCase } from '@application/use-cases/GetDocumentsUseCase';
import { DeleteDocumentUseCase } from '@application/use-cases/DeleteDocumentUseCase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistoryUseCase';

// 🆕 NUEVO USE CASE CON MEMORIA
import { SendMessageWithMemoryUseCase } from '@application/use-cases/SendMessageWithMemoryUseCase';
import { GenerateRecommendationMessageUseCase } from '@application/use-cases/GenerateRecommendationMessageUseCase';

// Controllers
import { DocumentController } from '@presentation/controllers/DocumentController';
import { ChatController } from '@presentation/controllers/ChatController';

// Routes
import { DocumentRoutes } from '@presentation/routes/DocumentRoutes';
import { ChatRoutes } from '@presentation/routes/ChatRoutes';

export class DependencyContainer {
  // Repositories
  private documentRepository: InMemoryDocumentRepository;
  private chatRepository: InMemoryChatRepository;
  private vectorRepository: ChromaVectorRepository;

  // Services
  private pdfService: PDFService;
  private textSplitterService: TextSplitterService;
  private embeddingService: CachedOllamaEmbeddingService; // 🆕 Con cache
  private chatService: OllamaChatService;
  private ollamaService: OllamaService; // Servicio Ollama general
  private usersServiceClient: UsersServiceClient; // 🆕 Cliente para api-users

  // Use Cases - Documents
  private uploadDocumentUseCase: UploadDocumentUseCase;
  private processDocumentUseCase: ProcessDocumentUseCase;
  private getDocumentsUseCase: GetDocumentsUseCase;
  private deleteDocumentUseCase: DeleteDocumentUseCase;

  // Use Cases - Chat
  private sendMessageUseCase: SendMessageWithMemoryUseCase; // 🆕 Con memoria
  private getChatHistoryUseCase: GetChatHistoryUseCase;
  private generateRecommendationMessageUseCase: GenerateRecommendationMessageUseCase;

  // Controllers
  private documentController: DocumentController;
  private chatController: ChatController;

  constructor() {
    console.log('🚀 Inicializando DependencyContainer CON MEMORIA...');

    // 1. Inicializar Repositories
    this.documentRepository = new InMemoryDocumentRepository();
    this.chatRepository = new InMemoryChatRepository();
    this.vectorRepository = new ChromaVectorRepository();

    // 2. Inicializar Services
    this.pdfService = new PDFService();
    this.textSplitterService = new TextSplitterService();

    // 🆕 Embedding service con cache
    this.embeddingService = new CachedOllamaEmbeddingService();
    console.log('  ✓ Embedding service con cache inicializado');

    this.chatService = new OllamaChatService();

    // Servicio Ollama general
    this.ollamaService = new OllamaService();

    // 🆕 Cliente para comunicación con api-users
    this.usersServiceClient = new UsersServiceClient();
    console.log('  ✓ Users service client inicializado');

    // 3. Inicializar Use Cases - Documents
    this.uploadDocumentUseCase = new UploadDocumentUseCase(this.documentRepository);

    this.processDocumentUseCase = new ProcessDocumentUseCase(
      this.documentRepository,
      this.vectorRepository,
      this.pdfService,
      this.embeddingService,
      this.textSplitterService
    );

    this.getDocumentsUseCase = new GetDocumentsUseCase(this.documentRepository);

    this.deleteDocumentUseCase = new DeleteDocumentUseCase(
      this.documentRepository,
      this.vectorRepository
    );

    // 4. Inicializar Use Cases - Chat
    // 🆕 Usar el nuevo use case con memoria
    this.sendMessageUseCase = new SendMessageWithMemoryUseCase(
      this.vectorRepository,
      this.chatService,
      this.embeddingService,
      this.usersServiceClient
    );
    console.log('  ✓ SendMessageWithMemoryUseCase inicializado');

    this.getChatHistoryUseCase = new GetChatHistoryUseCase(this.chatRepository);

    this.generateRecommendationMessageUseCase = new GenerateRecommendationMessageUseCase(
      this.ollamaService
    );

    // 5. Inicializar Controllers
    this.documentController = new DocumentController(
      this.uploadDocumentUseCase,
      this.processDocumentUseCase,
      this.getDocumentsUseCase,
      this.deleteDocumentUseCase
    );

    this.chatController = new ChatController(
      this.sendMessageUseCase,
      this.getChatHistoryUseCase,
      this.generateRecommendationMessageUseCase
    );

    console.log('✅ DependencyContainer CON MEMORIA listo\n');
  }

  /**
   * Inicializa la conexión con ChromaDB y verifica servicios externos
   */
  async initialize(): Promise<void> {
    console.log('🔧 Inicializando servicios externos...\n');

    // 1. ChromaDB
    console.log('📦 Inicializando ChromaDB...');
    try {
      await this.vectorRepository.initialize();
      console.log('  ✅ ChromaDB conectado\n');
    } catch (error: any) {
      console.error('  ❌ Error conectando ChromaDB:', error.message);
      throw error;
    }

    // 2. Verificar Ollama
    console.log('🤖 Verificando Ollama...');
    const embeddingAvailable = await this.embeddingService.checkModelAvailability();
    const chatAvailable = await this.chatService.checkModelAvailability();

    if (!embeddingAvailable) {
      console.warn('  ⚠️  Modelo de embeddings no disponible');
    } else {
      console.log('  ✅ Modelo de embeddings disponible');
    }

    if (!chatAvailable) {
      console.warn('  ⚠️  Modelo de chat no disponible');
    } else {
      console.log('  ✅ Modelo de chat disponible');
    }

    console.log();

    // 3. Verificar api-users
    console.log('👥 Verificando api-users...');
    const usersServiceAvailable = await this.usersServiceClient.healthCheck();

    if (!usersServiceAvailable) {
      console.warn('  ⚠️  api-users no está disponible. Algunas funciones de memoria no funcionarán.');
      console.warn('  💡 Asegúrate de que api-users esté corriendo en el puerto configurado.');
    } else {
      console.log('  ✅ api-users conectado');
    }

    console.log('\n🎉 Inicialización completada\n');
  }

  /**
   * Obtiene el router de documentos configurado
   */
  getDocumentRoutes(): Router {
    return DocumentRoutes.create(this.documentController);
  }

  /**
   * Obtiene el router de chat configurado
   */
  getChatRoutes(): Router {
    return ChatRoutes.create(this.chatController);
  }

  /**
   * Obtiene el repositorio vectorial (para testing o uso directo)
   */
  getVectorRepository(): ChromaVectorRepository {
    return this.vectorRepository;
  }

  /**
   * Obtiene estadísticas del cache de embeddings
   */
  async getCacheStats() {
    return await this.embeddingService.getCacheStats();
  }

  /**
   * Limpiar cache de embeddings
   */
  async clearEmbeddingCache() {
    await this.embeddingService.clearCache();
  }

  /**
   * Obtiene información del sistema
   */
  async getSystemInfo() {
    const cacheStats = await this.getCacheStats();

    return {
      embeddingModel: this.embeddingService.getInfo(),
      chatModel: this.chatService.getModelInfo(),
      documentsCount: this.documentRepository.size(),
      chatMessagesCount: this.chatRepository.size(),
      cache: {
        totalCached: cacheStats.totalCached,
        hitRate: `${cacheStats.hitRate}%`
      }
    };
  }

  /**
   * Verifica que todos los servicios externos estén disponibles
   */
  async checkServices(): Promise<{
    chromadb: boolean;
    ollamaEmbedding: boolean;
    ollamaChat: boolean;
    usersService: boolean;
  }> {
    const results = {
      chromadb: false,
      ollamaEmbedding: false,
      ollamaChat: false,
      usersService: false
    };

    try {
      const count = await this.vectorRepository.getCount();
      results.chromadb = count >= 0;
    } catch (error) {
      console.error('ChromaDB no disponible:', error);
    }

    try {
      results.ollamaEmbedding = await this.embeddingService.checkModelAvailability();
    } catch (error) {
      console.error('Ollama Embedding no disponible:', error);
    }

    try {
      results.ollamaChat = await this.chatService.checkModelAvailability();
    } catch (error) {
      console.error('Ollama Chat no disponible:', error);
    }

    try {
      results.usersService = await this.usersServiceClient.healthCheck();
    } catch (error) {
      console.error('Users Service no disponible:', error);
    }

    return results;
  }

  /**
   * Obtener cliente de users service (para uso directo si es necesario)
   */
  getUsersServiceClient(): UsersServiceClient {
    return this.usersServiceClient;
  }
}
