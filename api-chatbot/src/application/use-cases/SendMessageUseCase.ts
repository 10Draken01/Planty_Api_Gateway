/**
 * Use Case: Enviar un mensaje al chatbot (RAG)
 * - Genera embedding del query
 * - Busca chunks relevantes en ChromaDB
 * - Construye contexto
 * - Genera respuesta con Ollama
 */

import { ChatMessage, MessageRole } from '@domain/entities/ChatMessage';
import { ChatRepository } from '@domain/repositories/ChatRepository';
import { VectorRepository } from '@domain/repositories/VectorRepository';
import { SendMessageDTO, ChatResponseDTO } from '../dtos/ChatDTOs';
import { v4 as uuidv4 } from 'uuid';

export interface IChatService {
  generateResponse(
    query: string,
    context: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string>;
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}

export class SendMessageUseCase {
  constructor(
    private chatRepository: ChatRepository,
    private vectorRepository: VectorRepository,
    private chatService: IChatService,
    private embeddingService: IEmbeddingService
  ) {}

  async execute(dto: SendMessageDTO): Promise<ChatResponseDTO> {
    const {
      sessionId = uuidv4(),
      message,
      includeContext = true,
      maxContextChunks = 5
    } = dto;

    // Validaciones
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    // 1. Guardar mensaje del usuario
    const userMessage = ChatMessage.create(sessionId, MessageRole.USER, message);
    await this.chatRepository.save(userMessage);

    let sources: ChatResponseDTO['sources'] = [];
    let contextText = '';

    // 2. Si se debe incluir contexto, hacer búsqueda RAG
    if (includeContext) {
      try {
        // Generar embedding del query
        console.log('Generando embedding del query...');
        const queryEmbedding = await this.embeddingService.generateEmbedding(message);

        // Buscar chunks similares
        console.log(`Buscando top ${maxContextChunks} chunks relevantes...`);
        const searchResults = await this.vectorRepository.searchSimilar(
          queryEmbedding,
          maxContextChunks
        );

        if (searchResults.length > 0) {
          console.log(`Se encontraron ${searchResults.length} chunks relevantes`);

          // Construir contexto y sources
          contextText = searchResults
            .map((result, idx) => {
              return `[Fragmento ${idx + 1}]:\n${result.chunk.content}`;
            })
            .join('\n\n');

          sources = searchResults.map((result) => ({
            content: result.chunk.content,
            score: result.score,
            metadata: result.chunk.metadata
          }));
        } else {
          console.log('No se encontraron chunks relevantes');
        }
      } catch (error) {
        console.error('Error en búsqueda RAG:', error);
        // Continuar sin contexto si falla la búsqueda
      }
    }

    // 3. Obtener historial de conversación (últimos 5 mensajes)
    const conversationHistory = await this.chatRepository.findLastMessages(sessionId, 5);
    const historyFormatted = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    // 4. Generar respuesta con el LLM
    console.log('Generando respuesta con Ollama...');
    const response = await this.chatService.generateResponse(
      message,
      contextText,
      historyFormatted
    );

    // 5. Guardar respuesta del asistente
    const assistantMessage = ChatMessage.create(sessionId, MessageRole.ASSISTANT, response, {
      sources: sources.map((s) => s.content.substring(0, 100)),
      relevanceScore: sources.length > 0 ? sources[0].score : undefined
    });

    await this.chatRepository.save(assistantMessage);

    // 6. Retornar respuesta
    return {
      sessionId,
      message,
      response,
      sources: sources.length > 0 ? sources : undefined,
      timestamp: new Date()
    };
  }
}
