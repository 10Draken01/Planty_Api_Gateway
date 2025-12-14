export interface SendMessageDTO {
  userId: string; // 🆕 REQUERIDO: ID del usuario
  sessionId?: string; // 🆕 OPCIONAL: ID de sesión (se crea si no existe)
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

  // 🆕 NUEVOS CAMPOS
  userContext?: {
    name: string;
    experienceLevel: number;
    activePlants: string[];
  };
  conversationContext?: {
    messageCount: number;
    tags: string[];
  };

  // 🌿 PLANTY SYSTEM
  currentPersonality?: string;
  availablePersonalities?: string[];
  personalityChanged?: boolean;
  needsUserProfile?: boolean;

  cached?: boolean; // Indica si el embedding vino del cache
  latencyMs?: number;

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
