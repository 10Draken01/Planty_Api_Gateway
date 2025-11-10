/**
 * Contenedor de Inyección de Dependencias
 * Ensambla todas las dependencias del sistema
 */

import { Router } from 'express';

// Repositories
import { InMemoryDocumentRepository } from '../repositories/InMemoryDocumentRepository';
import { InMemoryChatRepository } from '../repositories/InMemoryChatRepository';
import { ChromaVectorRepository } from '../database/ChromaVectorRepository';

// Services
import { PDFService } from '../services/PDFService';
import { TextSplitterService } from '../services/TextSplitterService';
import { OllamaEmbeddingService } from '../services/OllamaEmbeddingService';
import { OllamaChatService } from '../services/OllamaChatService';

// Use Cases
import { UploadDocumentUseCase } from '@application/use-cases/UploadDocumentUseCase';
import { ProcessDocumentUseCase } from '@application/use-cases/ProcessDocumentUseCase';
import { GetDocumentsUseCase } from '@application/use-cases/GetDocumentsUseCase';
import { DeleteDocumentUseCase } from '@application/use-cases/DeleteDocumentUseCase';
import { SendMessageUseCase } from '@application/use-cases/SendMessageUseCase';
import { GetChatHistoryUseCase } from '@application/use-cases/GetChatHistoryUseCase';

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
  private embeddingService: OllamaEmbeddingService;
  private chatService: OllamaChatService;

  // Use Cases - Documents
  private uploadDocumentUseCase: UploadDocumentUseCase;
  private processDocumentUseCase: ProcessDocumentUseCase;
  private getDocumentsUseCase: GetDocumentsUseCase;
  private deleteDocumentUseCase: DeleteDocumentUseCase;

  // Use Cases - Chat
  private sendMessageUseCase: SendMessageUseCase;
  private getChatHistoryUseCase: GetChatHistoryUseCase;

  // Controllers
  private documentController: DocumentController;
  private chatController: ChatController;

  constructor() {
    // 1. Inicializar Repositories
    this.documentRepository = new InMemoryDocumentRepository();
    this.chatRepository = new InMemoryChatRepository();
    this.vectorRepository = new ChromaVectorRepository();

    // 2. Inicializar Services
    this.pdfService = new PDFService();
    this.textSplitterService = new TextSplitterService();
    this.embeddingService = new OllamaEmbeddingService();
    this.chatService = new OllamaChatService();

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
    this.sendMessageUseCase = new SendMessageUseCase(
      this.chatRepository,
      this.vectorRepository,
      this.chatService,
      this.embeddingService
    );

    this.getChatHistoryUseCase = new GetChatHistoryUseCase(this.chatRepository);

    // 5. Inicializar Controllers
    this.documentController = new DocumentController(
      this.uploadDocumentUseCase,
      this.processDocumentUseCase,
      this.getDocumentsUseCase,
      this.deleteDocumentUseCase
    );

    this.chatController = new ChatController(
      this.sendMessageUseCase,
      this.getChatHistoryUseCase
    );
  }

  /**
   * Inicializa la conexión con ChromaDB
   */
  async initialize(): Promise<void> {
    console.log('Inicializando ChromaDB...');
    await this.vectorRepository.initialize();
    console.log('ChromaDB inicializado correctamente');
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
   * Obtiene información del sistema
   */
  getSystemInfo() {
    return {
      embeddingModel: this.embeddingService.getModelInfo(),
      chatModel: this.chatService.getModelInfo(),
      documentsCount: this.documentRepository.size(),
      chatMessagesCount: this.chatRepository.size()
    };
  }

  /**
   * Verifica que los servicios externos estén disponibles
   */
  async checkServices(): Promise<{
    chromadb: boolean;
    ollamaEmbedding: boolean;
    ollamaChat: boolean;
  }> {
    const results = {
      chromadb: false,
      ollamaEmbedding: false,
      ollamaChat: false
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

    return results;
  }
}
