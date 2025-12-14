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
import { GroqChatService } from '../services/GroqChatService';
import { OllamaService } from '../services/OllamaService';

// Embedding Services
import { CachedOllamaEmbeddingService } from '../services/CachedOllamaEmbeddingService';
import { OpenAIEmbeddingService } from '../services/OpenAIEmbeddingService';
import { JinaEmbeddingService } from '../services/JinaEmbeddingService';
import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';

// External Services
import { UsersServiceClient } from '../external/UsersServiceClient';

// Config
import { config } from '@config/environment';

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
  private embeddingService: IEmbeddingService; // Soporta múltiples providers
  private chatService: OllamaChatService | GroqChatService; // 🆕 Soporta Ollama o Groq
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

    // Inicializar embedding service según configuración
    const embeddingProvider = config.embeddingProvider || 'ollama';
    if (embeddingProvider === 'openai') {
      this.embeddingService = new OpenAIEmbeddingService();
      console.log('  ✓ OpenAI Embedding service inicializado');
    } else if (embeddingProvider === 'jina') {
      this.embeddingService = new JinaEmbeddingService();
      console.log('  ✓ Jina AI Embedding service inicializado (GRATIS - 8000 req/día)');
    } else {
      // Default: Ollama con cache
      this.embeddingService = new CachedOllamaEmbeddingService();
      console.log('  ✓ Ollama Embedding service con cache inicializado');
    }

    // 🆕 Inicializar servicio de chat según configuración
    if (config.llmProvider === 'groq') {
      this.chatService = new GroqChatService();
      console.log('  ✓ Groq Chat service inicializado');
    } else {
      this.chatService = new OllamaChatService();
      console.log('  ✓ Ollama Chat service inicializado');
    }

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

    // 2. Verificar LLM (Ollama o Groq)
    if (config.llmProvider === 'groq') {
      console.log('🤖 Verificando Groq API...');
      const chatAvailable = await this.chatService.checkModelAvailability();

      if (!chatAvailable) {
        console.warn('  ⚠️  Groq API no disponible o API Key inválido');
      } else {
        console.log('  ✅ Groq API conectado y funcionando');
      }

      // Para embeddings (puede ser OpenAI u Ollama)
      console.log(`🧬 Verificando ${config.embeddingProvider} (embeddings)...`);
      const embeddingAvailable = (this.embeddingService as any).checkModelAvailability ?
        await (this.embeddingService as any).checkModelAvailability() : true;

      if (!embeddingAvailable) {
        console.warn('  ⚠️  Modelo de embeddings no disponible');
      } else {
        console.log('  ✅ Modelo de embeddings disponible');
      }
    } else {
      console.log('🤖 Verificando Ollama...');
      const embeddingAvailable = (this.embeddingService as any).checkModelAvailability ?
        await (this.embeddingService as any).checkModelAvailability() : true;
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
   * Obtiene estadísticas del cache de embeddings (solo Ollama)
   */
  async getCacheStats() {
    if ((this.embeddingService as any).getCacheStats) {
      return await (this.embeddingService as any).getCacheStats();
    }
    return { totalCached: 0, cacheHits: 0, cacheMisses: 0, hitRate: 0 };
  }

  /**
   * Limpiar cache de embeddings (solo Ollama)
   */
  async clearEmbeddingCache() {
    if ((this.embeddingService as any).clearCache) {
      await (this.embeddingService as any).clearCache();
    }
  }

  /**
   * Obtiene información del sistema
   */
  async getSystemInfo() {
    const cacheStats = await this.getCacheStats();
    const embeddingInfo = (this.embeddingService as any).getInfo ?
      (this.embeddingService as any).getInfo() :
      { provider: config.embeddingProvider };

    return {
      embeddingModel: embeddingInfo,
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
      results.ollamaEmbedding = (this.embeddingService as any).checkModelAvailability ?
        await (this.embeddingService as any).checkModelAvailability() : true;
    } catch (error) {
      console.error('Embedding service no disponible:', error);
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
