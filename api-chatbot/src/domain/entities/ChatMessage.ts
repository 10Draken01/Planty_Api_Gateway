/**
 * Entidad ChatMessage - Representa un mensaje en el chat
 */

export interface ChatMessageProps {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: string[];
    relevanceScore?: number;
    tokensUsed?: number;
  };
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export class ChatMessage {
  private constructor(private props: ChatMessageProps) {}

  static create(
    sessionId: string,
    role: MessageRole,
    content: string,
    metadata?: ChatMessageProps['metadata']
  ): ChatMessage {
    const messageProps: ChatMessageProps = {
      id: this.generateId(),
      sessionId,
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    return new ChatMessage(messageProps);
  }

  static fromPersistence(props: ChatMessageProps): ChatMessage {
    return new ChatMessage(props);
  }

  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get role(): MessageRole {
    return this.props.role;
  }

  get content(): string {
    return this.props.content;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get metadata(): ChatMessageProps['metadata'] {
    return this.props.metadata;
  }

  // Métodos de negocio
  addMetadata(metadata: ChatMessageProps['metadata']): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
  }

  toJSON(): ChatMessageProps {
    return { ...this.props };
  }
}
