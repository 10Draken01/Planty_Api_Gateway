import mongoose, { Schema, Document } from 'mongoose';

export interface OrchardDocument extends Document {
  userId?: string;
  name: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
    totalArea: number;
  };
  plants: Array<{
    plantId: number;
    name: string;
    quantity: number;
    position: { x: number; y: number };
    plantedAt?: Date;
    status: 'pending' | 'planted' | 'growing' | 'harvest_ready' | 'harvested';
  }>;
  metrics: {
    CEE: number;
    PSRNT: number;
    EH: number;
    UE: number;
    fitness: number;
  };
  objective: 'alimenticio' | 'medicinal' | 'sostenible' | 'ornamental';
  state: boolean;
  streakOfDays: number;
  timeOfLife: number;
  countPlants: number;
  calendar?: {
    season: string;
    hemisphere: 'north' | 'south';
    plantingSchedule: Array<{
      plantId: number;
      plant: string;
      plantingWeek: number;
      harvestWeek: number;
      daysToHarvest: number;
      notes: string;
    }>;
    monthlyTasks: Array<{
      month: string;
      week: number;
      tasks: string[];
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrchardSchema = new Schema<OrchardDocument>(
  {
    userId: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      totalArea: { type: Number, required: true },
    },
    plants: [
      {
        plantId: { type: Number, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
        plantedAt: { type: Date, required: false },
        status: {
          type: String,
          enum: ['pending', 'planted', 'growing', 'harvest_ready', 'harvested'],
          default: 'pending',
        },
      },
    ],
    metrics: {
      CEE: { type: Number, required: true },
      PSRNT: { type: Number, required: true },
      EH: { type: Number, required: true },
      UE: { type: Number, required: true },
      fitness: { type: Number, required: true },
    },
    objective: {
      type: String,
      enum: ['alimenticio', 'medicinal', 'sostenible', 'ornamental'],
      required: true,
    },
    state: {
      type: Boolean,
      default: true,
    },
    streakOfDays: {
      type: Number,
      default: 0,
    },
    timeOfLife: {
      type: Number,
      default: 0,
    },
    countPlants: {
      type: Number,
      required: true,
    },
    calendar: {
      season: String,
      hemisphere: {
        type: String,
        enum: ['north', 'south'],
      },
      plantingSchedule: [
        {
          plantId: Number,
          plant: String,
          plantingWeek: Number,
          harvestWeek: Number,
          daysToHarvest: Number,
          notes: String,
        },
      ],
      monthlyTasks: [
        {
          month: String,
          week: Number,
          tasks: [String],
        },
      ],
    },
  },
  {
    collection: 'orchards',
    timestamps: true,
  }
);

// Índices
OrchardSchema.index({ userId: 1 });
OrchardSchema.index({ createdAt: -1 });

export const OrchardModel = mongoose.model<OrchardDocument>('Orchard', OrchardSchema);
