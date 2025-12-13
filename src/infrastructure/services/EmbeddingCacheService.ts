/**
 * Servicio de Cache de Embeddings
 * Almacena embeddings en MongoDB para evitar recalcularlos
 */

import crypto from 'crypto';

export interface CachedEmbedding {
  text: string;
  normalizedText: string;
  embedding: number[];
  model: string;
  dimension: number;
  usage: {
    hitCount: number;
    firstCreated: Date;
    lastUsed: Date;
  };
  expiresAt: Date;
}

export interface EmbeddingCacheService {
  get(text: string): Promise<number[] | null>;
  set(text: string, embedding: number[], model: string): Promise<void>;
  has(text: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<{ totalCached: number; hitRate: number }>;
}

/**
 * Implementación en memoria (sin dependencias externas)
 * Para producción, reemplazar con MongoDB o Redis
 */
export class InMemoryEmbeddingCache implements EmbeddingCacheService {
  private cache: Map<string, CachedEmbedding> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private readonly TTL_DAYS = 30;

  async get(text: string): Promise<number[] | null> {
    const key = this.normalizeText(text);
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // Verificar si expiró
    if (new Date() > cached.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Actualizar estadísticas de uso
    cached.usage.hitCount++;
    cached.usage.lastUsed = new Date();
    this.hits++;

    console.log(`✅ Cache HIT para: "${text.substring(0, 50)}..."`);

    return cached.embedding;
  }

  async set(text: string, embedding: number[], model: string): Promise<void> {
    const key = this.normalizeText(text);
    const now = new Date();

    const cached: CachedEmbedding = {
      text,
      normalizedText: key,
      embedding,
      model,
      dimension: embedding.length,
      usage: {
        hitCount: 0,
        firstCreated: now,
        lastUsed: now
      },
      expiresAt: new Date(now.getTime() + this.TTL_DAYS * 24 * 60 * 60 * 1000)
    };

    this.cache.set(key, cached);

    console.log(`💾 Cache SET para: "${text.substring(0, 50)}..."`);
  }

  async has(text: string): Promise<boolean> {
    const key = this.normalizeText(text);
    const cached = this.cache.get(key);

    if (!cached) return false;

    // Verificar si expiró
    if (new Date() > cached.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('🗑️  Cache limpiado');
  }

  async getStats(): Promise<{ totalCached: number; hitRate: number }> {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      totalCached: this.cache.size,
      hitRate: parseFloat((hitRate * 100).toFixed(2))
    };
  }

  /**
   * Normalizar texto para usarlo como clave
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  /**
   * Limpiar embeddings expirados (ejecutar periódicamente)
   */
  async cleanExpired(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpiados ${cleaned} embeddings expirados`);
    }

    return cleaned;
  }
}

/**
 * Servicio de cache con embeddings usando hash para la clave
 */
export class HashedEmbeddingCache extends InMemoryEmbeddingCache {
  /**
   * Generar hash del texto para usar como clave única
   */
  protected hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  async get(text: string): Promise<number[] | null> {
    const key = this.hash(text);
    return super.get(key);
  }

  async set(text: string, embedding: number[], model: string): Promise<void> {
    const key = this.hash(text);
    return super.set(key, embedding, model);
  }

  async has(text: string): Promise<boolean> {
    const key = this.hash(text);
    return super.has(key);
  }
}

/**
 * Factory para crear el servicio de cache apropiado
 */
export function createEmbeddingCacheService(): EmbeddingCacheService {
  // Por ahora retornamos InMemory, pero puedes cambiar a MongoDB o Redis
  return new InMemoryEmbeddingCache();
}
