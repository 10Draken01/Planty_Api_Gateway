/**
 * Servicio de Embeddings usando OpenAI
 * MEJOR OPCIÓN para producción - embeddings de alta calidad
 */

import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';
import OpenAI from 'openai';

export class OpenAIEmbeddingService implements IEmbeddingService {
  private openai: OpenAI;
  private model: string;
  private dimension: number;

  constructor(apiKey?: string, model?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    // text-embedding-3-small: Barato, rápido, buena calidad
    // text-embedding-3-large: Mejor calidad, más caro
    this.model = model || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimension = this.model.includes('small') ? 1536 : 3072;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('El texto no puede estar vacío');
      }

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No se pudo generar el embedding');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generando embedding:', error);
      throw new Error(
        `Error al generar embedding con OpenAI: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      // OpenAI permite batch de hasta 2048 textos
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float'
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generando embeddings en batch:', error);
      // Fallback: generar uno por uno
      const embeddings: number[][] = [];
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }
      return embeddings;
    }
  }

  async checkModelAvailability(): Promise<boolean> {
    try {
      // Verificar que la API key funcione
      await this.openai.models.retrieve(this.model);
      return true;
    } catch {
      return false;
    }
  }

  getModelName(): string {
    return this.model;
  }

  getDimension(): number {
    return this.dimension;
  }
}
