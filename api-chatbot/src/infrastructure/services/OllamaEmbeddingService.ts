/**
 * Servicio de Embeddings usando Ollama
 */

import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';
import { Ollama } from 'ollama';

export class OllamaEmbeddingService implements IEmbeddingService {
  private ollama: Ollama;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.ollama = new Ollama({
      host: baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    });
    this.model = model || process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('El texto no puede estar vacío');
      }

      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text
      });

      if (!response.embedding || response.embedding.length === 0) {
        throw new Error('No se pudo generar el embedding');
      }

      return response.embedding;
    } catch (error) {
      console.error('Error generando embedding:', error);
      throw new Error(
        `Error al generar embedding con Ollama: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  /**
   * Genera embeddings en lote
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Verifica si el modelo está disponible
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      return models.models.some((m) => m.name.includes(this.model));
    } catch (error) {
      console.error('Error verificando disponibilidad del modelo:', error);
      return false;
    }
  }

  /**
   * Obtiene información del modelo
   */
  getModelInfo(): { baseUrl: string; model: string } {
    return {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: this.model
    };
  }
}
