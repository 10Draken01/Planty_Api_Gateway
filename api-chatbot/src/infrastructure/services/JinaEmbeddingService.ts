/**
 * Servicio de Embeddings usando Jina AI
 * GRATUITO: 8000 requests/día
 * Excelente alternativa cuando usas Groq para chat
 */

import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';
import axios from 'axios';

export class JinaEmbeddingService implements IEmbeddingService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.jina.ai/v1/embeddings';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.JINA_API_KEY || '';
    // jina-embeddings-v2-base-en: 768 dimensiones, muy rápido
    // jina-embeddings-v2-small-en: 512 dimensiones, más rápido
    this.model = model || process.env.JINA_EMBEDDING_MODEL || 'jina-embeddings-v2-base-en';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('El texto no puede estar vacío');
      }

      if (!this.apiKey) {
        throw new Error('JINA_API_KEY no configurado');
      }

      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          input: [text]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('No se pudo generar el embedding');
      }

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generando embedding con Jina:', error);
      throw new Error(
        `Error al generar embedding con Jina AI: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      if (!this.apiKey) {
        throw new Error('JINA_API_KEY no configurado');
      }

      // Jina soporta batch
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          input: texts
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error generando embeddings en batch con Jina:', error);
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
      if (!this.apiKey) {
        return false;
      }
      // Verificar con un texto de prueba pequeño
      await this.generateEmbedding('test');
      return true;
    } catch {
      return false;
    }
  }

  getModelName(): string {
    return this.model;
  }

  getInfo() {
    return {
      provider: 'jina',
      model: this.model,
      dimensions: this.model.includes('small') ? 512 : 768
    };
  }
}
