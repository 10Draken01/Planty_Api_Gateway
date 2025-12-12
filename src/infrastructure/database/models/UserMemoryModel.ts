/**
 * Modelo MongoDB para Memoria del Usuario
 * Almacena hechos, preferencias y conocimientos extraídos de conversaciones
 */

import mongoose, { Schema, Document } from 'mongoose';

// Interfaces
export interface UserFact {
  id: string;
  fact: string;
  extractedFrom: {
    conversationId: string;
    messageId: string;
    timestamp: Date;
  };
  confidence: number; // 0-1
  category: 'preference' | 'fact' | 'goal' | 'problem';
  isActive: boolean;
}

export interface UserPlant {
  plantId: number;
  plantName: string;
  status: 'growing' | 'planning' | 'harvested' | 'problem';
  notes: string[];
  mentionedAt: Date[];
}

export interface CommonProblem {
  problem: string;
  frequency: number;
  lastMentioned: Date;
  solutions: string[];
}

export interface UserMemoryDocument extends Document {
  _id: string;
  userId: string;
  facts: UserFact[];
  userPlants: UserPlant[];
  commonProblems: CommonProblem[];
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const ExtractedFromSchema = new Schema({
  conversationId: { type: String, required: true },
  messageId: { type: String, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

const UserFactSchema = new Schema({
  id: { type: String, required: true },
  fact: { type: String, required: true },
  extractedFrom: { type: ExtractedFromSchema, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  category: {
    type: String,
    enum: ['preference', 'fact', 'goal', 'problem'],
    required: true
  },
  isActive: { type: Boolean, required: true, default: true }
}, { _id: false });

const UserPlantSchema = new Schema({
  plantId: { type: Number, required: true },
  plantName: { type: String, required: true },
  status: {
    type: String,
    enum: ['growing', 'planning', 'harvested', 'problem'],
    required: true
  },
  notes: [{ type: String }],
  mentionedAt: [{ type: Date }]
}, { _id: false });

const CommonProblemSchema = new Schema({
  problem: { type: String, required: true },
  frequency: { type: Number, required: true, default: 1 },
  lastMentioned: { type: Date, required: true },
  solutions: [{ type: String }]
}, { _id: false });

// Schema principal
const UserMemorySchema = new Schema<UserMemoryDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true, index: true },
    facts: [UserFactSchema],
    userPlants: [UserPlantSchema],
    commonProblems: [CommonProblemSchema]
  },
  {
    timestamps: true,
    collection: 'user_memories'
  }
);

// Índices
UserMemorySchema.index({ 'facts.category': 1 });
UserMemorySchema.index({ 'userPlants.status': 1 });
UserMemorySchema.index({ 'commonProblems.frequency': -1 });

// Métodos de instancia
UserMemorySchema.methods.addFact = function(
  fact: string,
  category: UserFact['category'],
  extractedFrom: UserFact['extractedFrom'],
  confidence: number = 0.8
) {
  const newFact: UserFact = {
    id: `fact_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    fact,
    extractedFrom,
    confidence,
    category,
    isActive: true
  };

  this.facts.push(newFact);
  return newFact;
};

UserMemorySchema.methods.addOrUpdatePlant = function(
  plantId: number,
  plantName: string,
  status: UserPlant['status'],
  note?: string
) {
  const existingPlant = this.userPlants.find((p: UserPlant) => p.plantId === plantId);

  if (existingPlant) {
    existingPlant.status = status;
    if (note) {
      existingPlant.notes.push(note);
    }
    existingPlant.mentionedAt.push(new Date());
    return existingPlant;
  } else {
    const newPlant: UserPlant = {
      plantId,
      plantName,
      status,
      notes: note ? [note] : [],
      mentionedAt: [new Date()]
    };
    this.userPlants.push(newPlant);
    return newPlant;
  }
};

UserMemorySchema.methods.addOrUpdateProblem = function(
  problem: string,
  solution?: string
) {
  const existingProblem = this.commonProblems.find(
    (p: CommonProblem) => p.problem.toLowerCase() === problem.toLowerCase()
  );

  if (existingProblem) {
    existingProblem.frequency += 1;
    existingProblem.lastMentioned = new Date();
    if (solution && !existingProblem.solutions.includes(solution)) {
      existingProblem.solutions.push(solution);
    }
    return existingProblem;
  } else {
    const newProblem: CommonProblem = {
      problem,
      frequency: 1,
      lastMentioned: new Date(),
      solutions: solution ? [solution] : []
    };
    this.commonProblems.push(newProblem);
    return newProblem;
  }
};

UserMemorySchema.methods.getActiveFacts = function(): UserFact[] {
  return this.facts.filter((f: UserFact) => f.isActive);
};

UserMemorySchema.methods.getPlantsByStatus = function(status: UserPlant['status']): UserPlant[] {
  return this.userPlants.filter((p: UserPlant) => p.status === status);
};

UserMemorySchema.methods.getTopProblems = function(limit: number = 5): CommonProblem[] {
  return this.commonProblems
    .sort((a: CommonProblem, b: CommonProblem) => b.frequency - a.frequency)
    .slice(0, limit);
};

// Métodos estáticos
UserMemorySchema.statics.createNew = function(userId: string) {
  const _id = `memory_${userId}`;

  return new this({
    _id,
    userId,
    facts: [],
    userPlants: [],
    commonProblems: []
  });
};

// Modelo
export const UserMemoryModel = mongoose.model<UserMemoryDocument>(
  'UserMemory',
  UserMemorySchema
);
