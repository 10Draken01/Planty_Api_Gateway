/**
 * Use Case: Obtener lista de documentos
 */

import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { DocumentListDTO, DocumentInfoDTO } from '../dtos/DocumentDTOs';

export class GetDocumentsUseCase {
  constructor(private documentRepository: DocumentRepository) {}

  async execute(): Promise<DocumentListDTO> {
    const documents = await this.documentRepository.findAll();

    const documentDTOs: DocumentInfoDTO[] = documents.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      originalName: doc.originalName,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      processedAt: doc.processedAt,
      status: doc.status,
      totalChunks: doc.totalChunks,
      metadata: doc.metadata
    }));

    return {
      documents: documentDTOs,
      total: documentDTOs.length
    };
  }
}
