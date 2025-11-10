
export interface SendMessageDTO {
  sessionId?: string;
  message: string;
  includeContext?: boolean;
  maxContextChunks?: number;
}

export interface ChatResponseDTO {
  sessionId: string;
  message: string;
  response: string;
  sources?: Array<{
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  timestamp: Date;
}

export interface ChatHistoryDTO {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
}
