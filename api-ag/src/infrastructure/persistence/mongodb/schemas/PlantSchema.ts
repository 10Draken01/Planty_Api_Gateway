import mongoose, { Schema, Document } from 'mongoose';

export interface PlantDocument extends Document {
  id: number;
  species: string;
  scientificName: string;
  type: string[];
  sunRequirement: 'low' | 'medium' | 'high';
  weeklyWatering: number;
  harvestDays: number;
  soilType: string;
  waterPerKg: number;
  benefits: string[];
  size: number;
}

const PlantSchema = new Schema<PlantDocument>(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    species: {
      type: String,
      required: true,
      unique: true,
    },
    scientificName: {
      type: String,
      required: true,
    },
    type: {
      type: [String],
      required: true,
    },
    sunRequirement: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    weeklyWatering: {
      type: Number,
      required: true,
    },
    harvestDays: {
      type: Number,
      required: true,
    },
    soilType: {
      type: String,
      required: true,
    },
    waterPerKg: {
      type: Number,
      required: true,
    },
    benefits: {
      type: [String],
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    collection: 'plants',
    timestamps: false,
  }
);

// Índices
PlantSchema.index({ species: 1 });
PlantSchema.index({ type: 1 });

export const PlantModel = mongoose.model<PlantDocument>('Plant', PlantSchema);
