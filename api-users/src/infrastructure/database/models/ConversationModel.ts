/**
 * Modelo MongoDB para Conversaciones
 * Almacena el historial completo de conversaciones del chatbot
 */

import mongoose, { Schema, Document } from 'mongoose';

// Interfaces
export interface MessageMetadata {
  retrievedChunks?: Array<{
    chunkId: string;
    documentName: string;
    relevanceScore: number;
  }>;
  modelUsed: string;
  tokensUsed?: number;
  latencyMs?: number;
  ragEnabled: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface SessionMetadata {
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  avgResponseTime: number;
  userSatisfaction?: number; // 1-5
  tags: string[];
}

export interface ConversationDocument extends Document {
  _id: string;
  userId: string;
  sessionId: string;
  messages: Message[];
  sessionMetadata: SessionMetadata;
  isActive: boolean;
  endedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const MessageMetadataSchema = new Schema({
  retrievedChunks: [{
    chunkId: { type: String },
    documentName: { type: String },
    relevanceScore: { type: Number }
  }],
  modelUsed: { type: String, required: true },
  tokensUsed: { type: Number },
  latencyMs: { type: Number },
  ragEnabled: { type: Boolean, required: true, default: true }
}, { _id: false });

const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  metadata: { type: MessageMetadataSchema }
}, { _id: false });

const SessionMetadataSchema = new Schema({
  startedAt: { type: Date, required: true },
  lastMessageAt: { type: Date, required: true },
  messageCount: { type: Number, required: true, default: 0 },
  avgResponseTime: { type: Number, required: true, default: 0 },
  userSatisfaction: { type: Number, min: 1, max: 5 },
  tags: [{ type: String }]
}, { _id: false });

// Schema principal
const ConversationSchema = new Schema<ConversationDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messages: [MessageSchema],
    sessionMetadata: { type: SessionMetadataSchema, required: true },
    isActive: { type: Boolean, required: true, default: true, index: true },
    endedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true } // Para TTL
  },
  {
    timestamps: true,
    collection: 'conversations'
  }
);

// Índices compuestos
ConversationSchema.index({ userId: 1, sessionId: 1 });
ConversationSchema.index({ userId: 1, 'sessionMetadata.lastMessageAt': -1 });
ConversationSchema.index({ 'sessionMetadata.tags': 1 });

// TTL Index: Auto-eliminar después de expiresAt
ConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Métodos de instancia
ConversationSchema.methods.addMessage = function(message: Omit<Message, 'id' | 'timestamp'>) {
  const newMessage: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date(),
    ...message
  };

  this.messages.push(newMessage);
  this.sessionMetadata.lastMessageAt = newMessage.timestamp;
  this.sessionMetadata.messageCount = this.messages.length;

  return newMessage;
};

ConversationSchema.methods.endSession = function(satisfaction?: number) {
  this.isActive = false;
  this.endedAt = new Date();
  if (satisfaction) {
    this.sessionMetadata.userSatisfaction = satisfaction;
  }
};

ConversationSchema.methods.getRecentMessages = function(limit: number = 10): Message[] {
  return this.messages.slice(-limit);
};

// Métodos estáticos
ConversationSchema.statics.createNew = function(userId: string, sessionId?: string) {
  const _id = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const now = new Date();

  return new this({
    _id,
    userId,
    sessionId: sessionId || `sess_${Date.now()}`,
    messages: [],
    sessionMetadata: {
      startedAt: now,
      lastMessageAt: now,
      messageCount: 0,
      avgResponseTime: 0,
      tags: []
    },
    isActive: true,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días
  });
};

// Modelo
export const ConversationModel = mongoose.model<ConversationDocument>(
  'Conversation',
  ConversationSchema
);
