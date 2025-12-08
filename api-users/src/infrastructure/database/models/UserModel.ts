import mongoose, { Schema, Document } from 'mongoose';

// Nuevas interfaces para chatbot
export interface ChatPreferences {
  favoritePlants: string[];
  interests: string[];
  responseStyle: 'concise' | 'detailed';
  language: 'es' | 'en';
}

export interface ChatMetrics {
  totalMessages: number;
  totalSessions: number;
  averageSessionDuration: number;
  lastActiveAt?: Date;
  satisfactionScore?: number;
}

export interface UserDocument extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  is_verified: boolean;
  orchards_id: string[];
  count_orchards: number;
  experience_level: 1 | 2 | 3;
  profile_image: string;
  tokenFCM?: string;
  historyTimeUse_ids: Date[];

  // PREFERENCIAS DE USUARIO
  preferred_plant_category?: ('aromatic' | 'medicinal' | 'vegetable' | 'ornamental')[];
  favorite_plants?: number[];

  // NUEVOS CAMPOS PARA CHATBOT
  chatPreferences?: ChatPreferences;
  chatMetrics?: ChatMetrics;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  is_verified: {
    type: Boolean,
    required: true,
    default: false
  },
  orchards_id: { // 🔧 Campo faltante en el schema
    type: [String],
    default: []
  },
  count_orchards: { // 🔧 Campo faltante en el schema
    type: Number,
    default: 0
  },
  experience_level: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 3
  },
  profile_image: {
    type: String,
    required: false
  },
  tokenFCM: {
    type: String,
    required: false,
    default: null
  },
  historyTimeUse_ids: {
    type: [Date],
    default: []
  },

  // PREFERENCIAS DE USUARIO
  preferred_plant_category: {
    type: [String],
    enum: ['aromatic', 'medicinal', 'vegetable', 'ornamental'],
    required: false
  },
  favorite_plants: {
    type: [Number],
    default: [],
    required: false
  },

  // NUEVOS CAMPOS PARA CHATBOT
  chatPreferences: {
    favoritePlants: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    },
    responseStyle: {
      type: String,
      enum: ['concise', 'detailed'],
      default: 'detailed'
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    }
  },
  chatMetrics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    lastActiveAt: {
      type: Date
    },
    satisfactionScore: {
      type: Number,
      min: 1,
      max: 5
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices adicionales para chatbot
UserSchema.index({ 'chatMetrics.lastActiveAt': 1 });
UserSchema.index({ 'chatPreferences.interests': 1 });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);