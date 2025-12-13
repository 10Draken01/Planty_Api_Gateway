/**
 * Repositorio Vectorial - Define el contrato para operaciones con base de datos vectorial
 */

import { TextChunk } from '../entities/TextChunk';

export interface SearchResult {
  chunk: TextChunk;
  score: number;
  distance: number;
}

export interface VectorRepository {
  /**
   * Inicializa la conexión con la base de datos vectorial
   */
  initialize(): Promise<void>;

  /**
   * Añade chunks de texto con sus embeddings a la colección
   */
  addChunks(chunks: TextChunk[]): Promise<void>;

  /**
   * Realiza una búsqueda semántica basada en un query
   */
  searchSimilar(queryEmbedding: number[], topK?: number): Promise<SearchResult[]>;

  /**
   * Elimina todos los chunks asociados a un documento
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * Obtiene el conteo de chunks en la colección
   */
  getCount(): Promise<number>;

  /**
   * Limpia toda la colección
   */
  clear(): Promise<void>;

  /**
   * Verifica si la colección existe
   */
  collectionExists(): Promise<boolean>;

  /**
   * Crea la colección si no existe
   */
  createCollection(): Promise<void>;

  /**
   * Obtiene información de la colección
   */
  getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }>;
}
