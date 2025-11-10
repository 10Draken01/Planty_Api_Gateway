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

      // 4. Dividir en chunks (procesar por bloques para PDFs grandes)
      console.log(`Dividiendo texto en chunks (size: ${chunkSize}, overlap: ${chunkOverlap})`);
      console.log(`Tamaño del texto: ${text.length} caracteres`);

      const textChunks: string[] = [];
      const BLOCK_SIZE = 1000000; // Procesar 1MB de texto a la vez

      // Si el texto es muy grande, procesarlo por bloques
      if (text.length > BLOCK_SIZE) {
        console.log(`Texto muy grande, procesando por bloques de ${BLOCK_SIZE} caracteres`);

        for (let i = 0; i < text.length; i += BLOCK_SIZE) {
          const blockEnd = Math.min(i + BLOCK_SIZE + chunkSize, text.length);
          const block = text.substring(i, blockEnd);
          const blockChunks = this.textSplitter.splitText(block, chunkSize, chunkOverlap);
          textChunks.push(...blockChunks);

          console.log(`Bloque ${Math.floor(i / BLOCK_SIZE) + 1}: ${blockChunks.length} chunks generados`);
        }
      } else {
        const chunks = this.textSplitter.splitText(text, chunkSize, chunkOverlap);
        textChunks.push(...chunks);
      }

      if (textChunks.length === 0) {
        throw new Error('No se generaron chunks de texto');
      }

      console.log(`Total: ${textChunks.length} chunks generados`);

      // 5. Crear entidades TextChunk y generar embeddings en paralelo por lotes
      const chunks: TextChunk[] = [];
      const BATCH_SIZE = 50; // Procesar 50 chunks en paralelo
      const CHROMA_BATCH_SIZE = 500; // Insertar en ChromaDB cada 500 chunks (evitar timeout)
      let totalProcessed = 0; // Contador de chunks procesados

      console.log(`\n🚀 Iniciando procesamiento paralelo de ${textChunks.length} chunks`);
      console.log(`   📦 Tamaño de lote para embeddings: ${BATCH_SIZE}`);
      console.log(`   💾 Tamaño de lote para ChromaDB: ${CHROMA_BATCH_SIZE}\n`);

      for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, textChunks.length);
        const batch = textChunks.slice(i, batchEnd);

        // Generar embeddings en paralelo para este lote
        const embeddingPromises = batch.map(async (chunkText, batchIndex) => {
          const globalIndex = i + batchIndex;
          const embedding = await this.embeddingService.generateEmbedding(chunkText);

          const chunk = TextChunk.create(document.id, chunkText, globalIndex, {
            chunkSize,
            chunkOverlap
          });

          chunk.setEmbedding(embedding);
          return chunk;
        });

        const batchChunks = await Promise.all(embeddingPromises);
        chunks.push(...batchChunks);

        // Mostrar progreso cada 100 chunks
        if ((i + BATCH_SIZE) % 100 === 0 || batchEnd === textChunks.length) {
          const progress = ((batchEnd / textChunks.length) * 100).toFixed(2);
          console.log(`   ⏳ Progreso: ${batchEnd}/${textChunks.length} (${progress}%) - ${chunks.length} chunks listos`);
        }

        // Insertar en ChromaDB cada CHROMA_BATCH_SIZE chunks para evitar memoria
        if (chunks.length >= CHROMA_BATCH_SIZE || batchEnd === textChunks.length) {
          console.log(`   💾 Insertando ${chunks.length} chunks en ChromaDB...`);
          await this.vectorRepository.addChunks(chunks);
          totalProcessed += chunks.length;
          chunks.length = 0; // Limpiar array para liberar memoria
        }
      }

      // 6. Confirmar almacenamiento completo
      console.log(`\n✅ Procesamiento completado: ${totalProcessed} chunks almacenados en ChromaDB`);

      // 7. Marcar documento como procesado
      document.markAsProcessed(totalProcessed);
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
