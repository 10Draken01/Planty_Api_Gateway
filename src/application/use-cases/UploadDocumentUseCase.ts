/**
 * Use Case: Subir un documento PDF
 */

import { Document } from '@domain/entities/Document';
import { DocumentRepository } from '@domain/repositories/DocumentRepository';
import { UploadDocumentDTO, DocumentInfoDTO } from '../dtos/DocumentDTOs';
import * as fs from 'fs';
import * as path from 'path';

export class UploadDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private uploadsDir: string = path.join(process.cwd(), 'uploads')
  ) {
    // Asegurar que el directorio de uploads existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async execute(dto: UploadDocumentDTO): Promise<DocumentInfoDTO> {
    const { file, metadata } = dto;

    // Validaciones
    this.validateFile(file);

    // Verificar si ya existe un documento con el mismo nombre
    const existingDoc = await this.documentRepository.findByFilename(file.filename);
    if (existingDoc) {
      throw new Error(`Ya existe un documento con el nombre: ${file.filename}`);
    }

    // Crear entidad de documento
    const document = Document.create({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      metadata
    });

    // Guardar en repositorio
    const savedDocument = await this.documentRepository.save(document);

    // Retornar DTO
    return this.toDTO(savedDocument);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF');
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`El archivo excede el tamaño máximo permitido (${maxSize / 1024 / 1024}MB)`);
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
