

export interface UploadDocumentDTO {
  file: Express.Multer.File;
  metadata?: Record<string, any>;
}

export interface ProcessDocumentDTO {
  documentId: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface DocumentInfoDTO {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: string;
  totalChunks?: number;
  metadata?: Record<string, any>;
}

export interface DocumentListDTO {
  documents: DocumentInfoDTO[];
  total: number;
}
