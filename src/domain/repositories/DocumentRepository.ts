/**
 * Repositorio de Documentos - Define el contrato de persistencia
 */

import { Document } from '../entities/Document';

export interface DocumentRepository {
  /**
   * Guarda un documento en la base de datos
   */
  save(document: Document): Promise<Document>;

  /**
   * Busca un documento por su ID
   */
  findById(id: string): Promise<Document | null>;

  /**
   * Busca un documento por nombre de archivo
   */
  findByFilename(filename: string): Promise<Document | null>;

  /**
   * Lista todos los documentos
   */
  findAll(): Promise<Document[]>;

  /**
   * Lista documentos procesados
   */
  findProcessed(): Promise<Document[]>;

  /**
   * Actualiza un documento existente
   */
  update(document: Document): Promise<Document>;

  /**
   * Elimina un documento por su ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un documento con el filename dado
   */
  exists(filename: string): Promise<boolean>;
}
