/**
 * Use Case: Procesar un documento PDF
 * - Lee el PDF
 * - Lo divide en chunks
 * - Genera embeddings
 * - Almacena en ChromaDB
 */

import { Document, DocumentStatus } from '@domain/entities/Document';
import { TextChunk } from '@domain/entities/TextChunk';
import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { VectorRepository } from '@domain/repositories/VectorRepository';
import { ProcessDocumentDTO, DocumentInfoDTO } from '../dtos/DocumentDTOs';

export interface IPDFService {
  extractText(filePath: string): Promise<string>;
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}

export interface ITextSplitter {
  splitText(text: string, chunkSize: number, overlap: number): string[];
}

export class ProcessDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private vectorRepository: VectorRepository,
    private pdfService: IPDFService,
    private embeddingService: IEmbeddingService,
    private textSplitter: ITextSplitter
  ) {}

  async execute(dto: ProcessDocumentDTO): Promise<DocumentInfoDTO> {
    const { documentId, chunkSize = 1000, chunkOverlap = 200 } = dto;

    // 1. Buscar el documento
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Documento no encontrado: ${documentId}`);
    }

    if (document.status === DocumentStatus.PROCESSING) {
      throw new Error('El documento ya está siendo procesado');
    }

    if (document.status === DocumentStatus.PROCESSED) {
      throw new Error('El documento ya fue procesado');
    }

    try {
      // 2. Marcar como procesando
      document.markAsProcessing();
      await this.documentRepository.update(document);

      // 3. Extraer texto del PDF
      console.log(`Extrayendo texto del PDF: ${document.filePath}`);
      const text = await this.pdfService.extractText(document.filePath);

      if (!text || text.trim().length === 0) {
        throw new Error('No se pudo extraer texto del PDF');
      }

      // 4. Dividir en chunks
      console.log(`Dividiendo texto en chunks (size: ${chunkSize}, overlap: ${chunkOverlap})`);
      const textChunks = this.textSplitter.splitText(text, chunkSize, chunkOverlap);

      if (textChunks.length === 0) {
        throw new Error('No se generaron chunks de texto');
      }

      console.log(`Se generaron ${textChunks.length} chunks`);

      // 5. Crear entidades TextChunk y generar embeddings
      const chunks: TextChunk[] = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];

        console.log(`Generando embedding para chunk ${i + 1}/${textChunks.length}`);
        const embedding = await this.embeddingService.generateEmbedding(chunkText);

        const chunk = TextChunk.create(document.id, chunkText, i, {
          chunkSize,
          chunkOverlap
        });

        chunk.setEmbedding(embedding);
        chunks.push(chunk);
      }

      // 6. Almacenar en ChromaDB
      console.log(`Almacenando ${chunks.length} chunks en ChromaDB`);
      await this.vectorRepository.addChunks(chunks);

      // 7. Marcar documento como procesado
      document.markAsProcessed(chunks.length);
      document.updateMetadata({
        textLength: text.length,
        chunkSize,
        chunkOverlap,
        processedChunks: chunks.length
      });

      const updatedDocument = await this.documentRepository.update(document);

      console.log(`Documento procesado exitosamente: ${document.id}`);

      return this.toDTO(updatedDocument);
    } catch (error) {
      // Marcar como fallido
      document.markAsFailed();
      await this.documentRepository.update(document);

      throw error;
    }
  }

  private toDTO(document: Document): DocumentInfoDTO {
    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      fileSize: document.fileSize,
      uploadedAt: document.uploadedAt,
      processedAt: document.processedAt,
      status: document.status,
      totalChunks: document.totalChunks,
      metadata: document.metadata
    };
  }
}
