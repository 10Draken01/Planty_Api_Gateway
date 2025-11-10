/**
 * Entidad Document - Representa un documento PDF procesado
 */

export interface DocumentProps {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: DocumentStatus;
  totalChunks?: number;
  metadata?: Record<string, any>;
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

export class Document {
  private constructor(private props: DocumentProps) {}

  static create(props: Omit<DocumentProps, 'id' | 'uploadedAt' | 'status'>): Document {
    const documentProps: DocumentProps = {
      ...props,
      id: this.generateId(),
      uploadedAt: new Date(),
      status: DocumentStatus.UPLOADED
    };

    return new Document(documentProps);
  }

  static fromPersistence(props: DocumentProps): Document {
    return new Document(props);
  }

  private static generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get filename(): string {
    return this.props.filename;
  }

  get originalName(): string {
    return this.props.originalName;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }

  get status(): DocumentStatus {
    return this.props.status;
  }

  get totalChunks(): number | undefined {
    return this.props.totalChunks;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }

  // Métodos de negocio
  markAsProcessing(): void {
    this.props.status = DocumentStatus.PROCESSING;
  }

  markAsProcessed(totalChunks: number): void {
    this.props.status = DocumentStatus.PROCESSED;
    this.props.processedAt = new Date();
    this.props.totalChunks = totalChunks;
  }

  markAsFailed(): void {
    this.props.status = DocumentStatus.FAILED;
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
  }

  isProcessed(): boolean {
    return this.props.status === DocumentStatus.PROCESSED;
  }

  toJSON(): DocumentProps {
    return { ...this.props };
  }
}
