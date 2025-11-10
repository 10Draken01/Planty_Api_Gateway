/**
 * Implementación del repositorio vectorial usando ChromaDB
 */

import { VectorRepository, SearchResult } from '@domain/repositories/VectorRepository';
import { TextChunk } from '@domain/entities/TextChunk';
import { ChromaClient, Collection } from 'chromadb';

export class ChromaVectorRepository implements VectorRepository {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName: string;

  constructor(host?: string, port?: number, collectionName?: string) {
    const chromaHost = host || process.env.CHROMA_HOST || 'localhost';
    const chromaPort = port || parseInt(process.env.CHROMA_PORT || '8000');
    this.collectionName = collectionName || process.env.CHROMA_COLLECTION_NAME || 'plantas_suchiapa';

    this.client = new ChromaClient({
      path: `http://${chromaHost}:${chromaPort}`
    });
  }

  async initialize(): Promise<void> {
    try {
     

      // Verificar heartbeat
      const heartbeat = await this.client.heartbeat();
      console.log('ChromaDB heartbeat:', heartbeat);

      // Obtener o crear colección
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Vectores de documentos sobre plantas de Suchiapa' }
      });

      console.log(`Colección '${this.collectionName}' inicializada correctamente`);
    } catch (error) {
      console.error('Error inicializando ChromaDB:', error);
      throw new Error(
        `No se pudo conectar a ChromaDB: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async addChunks(chunks: TextChunk[]): Promise<void> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    if (chunks.length === 0) {
      return;
    }

    try {
      // Preparar datos para ChromaDB
      const ids: string[] = [];
      const embeddings: number[][] = [];
      const documents: string[] = [];
      const metadatas: Record<string, any>[] = [];

      for (const chunk of chunks) {
        if (!chunk.hasEmbedding()) {
          throw new Error(`El chunk ${chunk.id} no tiene embedding`);
        }

        ids.push(chunk.id);
        embeddings.push(chunk.embedding!);
        documents.push(chunk.content);
        metadatas.push({
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          ...chunk.metadata
        });
      }

      // Añadir a la colección
      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

      console.log(`Se añadieron ${chunks.length} chunks a ChromaDB`);
    } catch (error) {
      console.error('Error añadiendo chunks a ChromaDB:', error);
      throw new Error(
        `Error al almacenar chunks: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async searchSimilar(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    try {
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      });

      // Procesar resultados
      const searchResults: SearchResult[] = [];

      if (
        !results.ids ||
        !results.ids[0] ||
        !results.documents ||
        !results.documents[0] ||
        !results.distances ||
        !results.distances[0]
      ) {
        return [];
      }

      const ids = results.ids[0];
      const documents = results.documents[0];
      const distances = results.distances[0];
      const metadatas = results.metadatas?.[0] || [];

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const document = documents[i];
        const distance = distances[i];
        const metadata = metadatas[i] || {};

        if (!document) continue;

        // Convertir distancia a score (1 - distance para que mayor sea mejor)
        const score = 1 - distance;

        // Reconstruir TextChunk
        const chunk = TextChunk.fromPersistence({
          id,
          documentId: metadata.documentId as string,
          content: document,
          chunkIndex: metadata.chunkIndex as number,
          metadata: metadata as any
        });

        searchResults.push({
          chunk,
          score,
          distance
        });
      }

      return searchResults;
    } catch (error) {
      console.error('Error buscando chunks similares:', error);
      throw new Error(
        `Error en búsqueda semántica: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    try {
      // Buscar todos los chunks del documento
      const results = await this.collection.get({
        where: { documentId }
      });

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids
        });
        console.log(`Se eliminaron ${results.ids.length} chunks del documento ${documentId}`);
      }
    } catch (error) {
      console.error('Error eliminando chunks por documentId:', error);
      throw new Error(
        `Error al eliminar chunks: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async getCount(): Promise<number> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    try {
      const count = await this.collection.count();
      return count;
    } catch (error) {
      console.error('Error obteniendo conteo:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    try {
      // Eliminar la colección
      await this.client.deleteCollection({ name: this.collectionName });

      // Recrear la colección
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: 'Vectores de documentos sobre plantas de Suchiapa' }
      });

      console.log('Colección limpiada exitosamente');
    } catch (error) {
      console.error('Error limpiando colección:', error);
      throw new Error(
        `Error al limpiar colección: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async collectionExists(): Promise<boolean> {
    try {
      const collections = await this.client.listCollections();
      return collections.some((col:any) => col.name === this.collectionName);
    } catch (error) {
      console.error('Error verificando existencia de colección:', error);
      return false;
    }
  }

  async createCollection(): Promise<void> {
    try {
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: 'Vectores de documentos sobre plantas de Suchiapa' }
      });
      console.log(`Colección '${this.collectionName}' creada`);
    } catch (error) {
      console.error('Error creando colección:', error);
      throw new Error(
        `Error al crear colección: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async getCollectionInfo(): Promise<{
    name: string;
    count: number;
    metadata?: Record<string, any>;
  }> {
    if (!this.collection) {
      throw new Error('La colección no está inicializada. Llama a initialize() primero.');
    }

    try {
      const count = await this.collection.count();

      return {
        name: this.collectionName,
        count,
        metadata: { description: 'Vectores de documentos sobre plantas de Suchiapa' }
      };
    } catch (error) {
      console.error('Error obteniendo info de colección:', error);
      throw new Error(
        `Error al obtener info: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }
}
