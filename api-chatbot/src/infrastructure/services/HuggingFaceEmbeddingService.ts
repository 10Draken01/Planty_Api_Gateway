/**
 * Servicio de Embeddings usando Hugging Face Inference API
 *
 * GRATUITO con límites generosos:
 * - 1000 requests/hora en el tier gratuito
 * - Soporta múltiples modelos de embeddings
 *
 * Modelos recomendados:
 * - sentence-transformers/all-MiniLM-L6-v2 (384 dims, rápido)
 * - BAAI/bge-small-en-v1.5 (384 dims, buena calidad)
 * - sentence-transformers/all-mpnet-base-v2 (768 dims, alta calidad)
 */

import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';
import axios, { AxiosInstance } from 'axios';

export class HuggingFaceEmbeddingService implements IEmbeddingService {
  private client: AxiosInstance;
  private model: string;
  private apiKey: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
    this.model = model || process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

    if (!this.apiKey) {
      throw new Error(
        'Hugging Face API Key no configurado. ' +
        'Obtén tu API key gratuito en https://huggingface.co/settings/tokens'
      );
    }

    this.client = axios.create({
      baseURL: 'https://api-inference.huggingface.co',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });
  }

  /**
   * Genera embedding para un texto usando Hugging Face Inference API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('El texto no puede estar vacío');
      }

      // Usar el endpoint correcto de modelos específicos
      const response = await this.client.post(
        `/models/${this.model}`,
        {
          inputs: text,
          options: {
            wait_for_model: true, // Espera si el modelo está cargándose
            use_cache: false
          }
        }
      );

      // Hugging Face devuelve diferentes formatos dependiendo del modelo
      // Para sentence-transformers: number[][] (array de arrays)
      // Para otros: number[] o diferentes estructuras
      let embedding: number[] = [];

      if (Array.isArray(response.data)) {
        if (Array.isArray(response.data[0])) {
          // Si es number[][] (formato común para sentence-transformers)
          // Tomar el primer embedding y convertir a mean pooling si es necesario
          if (Array.isArray(response.data[0][0])) {
            // Es [[[...]]] - tomar el primero y hacer mean pooling
            embedding = this.meanPooling(response.data[0]);
          } else {
            // Es [[...]] - tomar el primer embedding
            embedding = response.data[0];
          }
        } else if (typeof response.data[0] === 'number') {
          // Si es number[], usar directamente
          embedding = response.data;
        }
      } else if (response.data && response.data.embedding) {
        embedding = response.data.embedding;
      }

      if (!embedding || embedding.length === 0) {
        throw new Error('No se pudo generar el embedding');
      }

      return embedding;

    } catch (error: any) {
      if (error.response?.status === 503) {
        throw new Error(
          `Modelo ${this.model} está cargándose. Intenta nuevamente en unos segundos.`
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          'API Key de Hugging Face inválido. Verifica tu configuración.'
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          'Límite de rate limit alcanzado en Hugging Face API. Espera unos minutos.'
        );
      } else if (error.response?.status === 410) {
        throw new Error(
          'API de Hugging Face deprecada. El equipo está trabajando en actualizar a la nueva API.'
        );
      }

      console.error('Error generando embedding con Hugging Face:', error.message);
      throw new Error(
        `Error al generar embedding con Hugging Face: ${error.message}`
      );
    }
  }

  /**
   * Aplica mean pooling a una matriz de embeddings
   * Útil cuando el modelo devuelve embeddings por token
   */
  private meanPooling(embeddings: number[][]): number[] {
    const numTokens = embeddings.length;
    const embeddingDim = embeddings[0].length;
    const result: number[] = new Array(embeddingDim).fill(0);

    // Sumar todos los embeddings
    for (let i = 0; i < numTokens; i++) {
      for (let j = 0; j < embeddingDim; j++) {
        result[j] += embeddings[i][j];
      }
    }

    // Dividir por el número de tokens para obtener el promedio
    for (let j = 0; j < embeddingDim; j++) {
      result[j] /= numTokens;
    }

    return result;
  }

  /**
   * Genera embeddings en lote
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Procesar en lotes para evitar timeout
    const batchSize = 10;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Verifica si el modelo está disponible
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      // Intentar generar un embedding de prueba
      await this.generateEmbedding('test');
      return true;
    } catch (error) {
      console.error('Error verificando disponibilidad del modelo Hugging Face:', error);
      return false;
    }
  }

  /**
   * Obtiene información del servicio
   */
  getInfo(): { provider: string; model: string; apiKeyConfigured: boolean } {
    return {
      provider: 'huggingface',
      model: this.model,
      apiKeyConfigured: !!this.apiKey
    };
  }
}
