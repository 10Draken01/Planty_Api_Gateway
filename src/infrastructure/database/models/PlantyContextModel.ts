import mongoose, { Schema, Document } from 'mongoose';

export interface PlantyContextDocument extends Document {
  _id: string;
  userId: string;
  currentPersonality: string;
  userProfile: {
    name: string;
    characteristics?: string[];
    preferredTone?: string;
    experience?: string;
  } | null;
  conversationHistory: string[];
  godReferences: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const PlantyContextSchema = new Schema<PlantyContextDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true, index: true },
    currentPersonality: { type: String, required: true, default: 'amigable' },
    userProfile: {
      type: {
        name: String,
        characteristics: [String],
        preferredTone: String,
        experience: String
      },
      default: null
    },
    conversationHistory: [{ type: String }],
    godReferences: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },
  {
    timestamps: true,
    collection: 'planty_contexts'
  }
);

PlantyContextSchema.index({ userId: 1 });

export const PlantyContextModel = mongoose.model<PlantyContextDocument>(
  'PlantyContext',
  PlantyContextSchema
);
