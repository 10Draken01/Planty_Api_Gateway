/**
 * Entidad TextChunk - Representa un fragmento de texto del documento
 */

export interface TextChunkProps {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata?: {
    pageNumber?: number;
    startPosition?: number;
    endPosition?: number;
    [key: string]: any;
  };
}

export class TextChunk {
  private constructor(private props: TextChunkProps) {}

  static create(
    documentId: string,
    content: string,
    chunkIndex: number,
    metadata?: TextChunkProps['metadata']
  ): TextChunk {
    const chunkProps: TextChunkProps = {
      id: this.generateId(documentId, chunkIndex),
      documentId,
      content,
      chunkIndex,
      metadata
    };

    return new TextChunk(chunkProps);
  }

  static fromPersistence(props: TextChunkProps): TextChunk {
    return new TextChunk(props);
  }

  private static generateId(documentId: string, chunkIndex: number): string {
    return `${documentId}_chunk_${chunkIndex}`;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get documentId(): string {
    return this.props.documentId;
  }

  get content(): string {
    return this.props.content;
  }

  get chunkIndex(): number {
    return this.props.chunkIndex;
  }

  get embedding(): number[] | undefined {
    return this.props.embedding;
  }

  get metadata(): TextChunkProps['metadata'] {
    return this.props.metadata;
  }

  // Métodos de negocio
  setEmbedding(embedding: number[]): void {
    this.props.embedding = embedding;
  }

  hasEmbedding(): boolean {
    return !!this.props.embedding && this.props.embedding.length > 0;
  }

  updateMetadata(metadata: TextChunkProps['metadata']): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
  }

  toJSON(): TextChunkProps {
    return { ...this.props };
  }
}
