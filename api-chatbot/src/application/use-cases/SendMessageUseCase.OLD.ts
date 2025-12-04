/**
 * Use Case: Enviar un mensaje al chatbot (RAG)
 * - Genera embedding del query
 * - Busca chunks relevantes en ChromaDB
 * - Construye contexto
 * - Genera respuesta con Ollama
 */

import { VectorRepository } from '@domain/repositories/VectorRepository';
import { SendMessageDTO } from '../dtos/ChatDTOs';

export interface IChatService {
  generateResponse(
    query: string,
    context: string
  ): Promise<string>;
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}

export class SendMessageUseCase {
  constructor(
    private vectorRepository: VectorRepository,
    private chatService: IChatService,
    private embeddingService: IEmbeddingService
  ) {}

  async execute(dto: SendMessageDTO): Promise<string> {
    const {
      message,
      includeContext = true,
      maxContextChunks = 5
    } = dto;

    // Validaciones
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    let contextText = '';

    // Si se debe incluir contexto, hacer búsqueda RAG
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

          // Construir contexto
          contextText = searchResults
            .map((result, idx) => {
              return `[Fragmento ${idx + 1}]:\n${result.chunk.content}`;
            })
            .join('\n\n');
        } else {
          console.log('No se encontraron chunks relevantes');
        }
      } catch (error) {
        console.error('Error en búsqueda RAG:', error);
        // Continuar sin contexto si falla la búsqueda
      }
    }

    // Generar respuesta con el LLM
    console.log('Generando respuesta con Ollama...');
    const response = await this.chatService.generateResponse(
      message,
      contextText
    );

    // Retornar solo la respuesta generada
    return response;
  }
}
