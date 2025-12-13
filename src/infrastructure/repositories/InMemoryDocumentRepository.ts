/**
 * Implementación en memoria del repositorio de documentos
 * Para producción, considerar usar MongoDB o PostgreSQL
 */

import { Document } from '@domain/entities/Document';
import { DocumentRepository } from '@domain/repositories/DocumentRepository';

export class InMemoryDocumentRepository implements DocumentRepository {
  private documents: Map<string, Document> = new Map();

  async save(document: Document): Promise<Document> {
    this.documents.set(document.id, document);
    return document;
  }

  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async findByFilename(filename: string): Promise<Document | null> {
    for (const doc of this.documents.values()) {
      if (doc.filename === filename) {
        return doc;
      }
    }
    return null;
  }

  async findAll(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async findProcessed(): Promise<Document[]> {
    return Array.from(this.documents.values()).filter((doc) => doc.isProcessed());
  }

  async update(document: Document): Promise<Document> {
    if (!this.documents.has(document.id)) {
      throw new Error(`Documento no encontrado: ${document.id}`);
    }
    this.documents.set(document.id, document);
    return document;
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async exists(filename: string): Promise<boolean> {
    for (const doc of this.documents.values()) {
      if (doc.filename === filename) {
        return true;
      }
    }
    return false;
  }

  // Método auxiliar para testing
  clear(): void {
    this.documents.clear();
  }

  // Método auxiliar para obtener tamaño
  size(): number {
    return this.documents.size;
  }
}
