import mongoose, { Schema, Document } from 'mongoose';

export interface CompatibilityMatrixDocument extends Document {
  plant1: string;
  plant2: string;
  score: number;
}

const CompatibilityMatrixSchema = new Schema<CompatibilityMatrixDocument>(
  {
    plant1: {
      type: String,
      required: true,
    },
    plant2: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
  },
  {
    collection: 'compatibility_matrix',
    timestamps: false,
  }
);

// Índice compuesto para búsquedas rápidas
CompatibilityMatrixSchema.index({ plant1: 1, plant2: 1 }, { unique: true });

export const CompatibilityMatrixModel = mongoose.model<CompatibilityMatrixDocument>(
  'CompatibilityMatrix',
  CompatibilityMatrixSchema
);
