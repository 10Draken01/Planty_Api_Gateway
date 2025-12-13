/**
 * Servicio de Embeddings con Cache
 * Combina OllamaEmbeddingService con EmbeddingCacheService
 */

import { IEmbeddingService } from '@application/use-cases/ProcessDocumentUseCase';
import { OllamaEmbeddingService } from './OllamaEmbeddingService';
import { EmbeddingCacheService, createEmbeddingCacheService } from './EmbeddingCacheService';

export class CachedOllamaEmbeddingService implements IEmbeddingService {
  private ollamaService: OllamaEmbeddingService;
  private cache: EmbeddingCacheService;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.ollamaService = new OllamaEmbeddingService(baseUrl, model);
    this.cache = createEmbeddingCacheService();
    this.model = model || process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Intentar obtener del cache
    const cached = await this.cache.get(text);

    if (cached) {
      return cached;
    }

    // Si no está en cache, generar con Ollama
    const startTime = Date.now();
    const embedding = await this.ollamaService.generateEmbedding(text);
    const latency = Date.now() - startTime;

    console.log(`⚡ Embedding generado en ${latency}ms (${text.length} chars)`);

    // Guardar en cache
    await this.cache.set(text, embedding, this.model);

    return embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Generar embeddings en batch optimizado
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const toGenerate: string[] = [];
    const indices: number[] = [];

    // Primero verificar cuáles están en cache
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const cached = await this.cache.get(text);

      if (cached) {
        embeddings[i] = cached;
      } else {
        toGenerate.push(text);
        indices.push(i);
      }
    }

    console.log(`📊 Cache: ${embeddings.filter(e => e).length}/${texts.length} hits`);

    // Generar los que faltan
    if (toGenerate.length > 0) {
      const newEmbeddings = await this.ollamaService.generateEmbeddings(toGenerate);

      for (let i = 0; i < toGenerate.length; i++) {
        const text = toGenerate[i];
        const embedding = newEmbeddings[i];
        const index = indices[i];

        embeddings[index] = embedding;

        // Guardar en cache
        await this.cache.set(text, embedding, this.model);
      }
    }

    return embeddings;
  }

  /**
   * Verificar disponibilidad del modelo
   */
  async checkModelAvailability(): Promise<boolean> {
    return await this.ollamaService.checkModelAvailability();
  }

  /**
   * Obtener información del modelo y cache
   */
  getInfo(): { baseUrl: string; model: string; cache: string } {
    const modelInfo = this.ollamaService.getModelInfo();

    return {
      ...modelInfo,
      cache: 'InMemory'
    };
  }

  /**
   * Obtener estadísticas del cache
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }

  /**
   * Limpiar cache
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}
