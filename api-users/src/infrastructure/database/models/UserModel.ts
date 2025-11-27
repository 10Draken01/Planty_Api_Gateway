import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  orchards_id: string[];
  count_orchards: number;
  experience_level: 1 | 2 | 3;
  profile_image: string;
  tokenFCM?: string; // Token de Firebase Cloud Messaging
  historyTimeUse_ids: Date[];
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
  experience_level: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 4
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
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  versionKey: false
});


export const UserModel = mongoose.model<UserDocument>('User', UserSchema);