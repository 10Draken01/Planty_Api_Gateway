import mongoose, { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  experience_level: number;
  profile_image?: string;
  historyTimeUse_ids: string[];
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
  historyTimeUse_ids: {
    type: [String],
    default: []
  }
}, {
  timestamps: true, 
  versionKey: false
});


export const UserModel = mongoose.model<UserDocument>('User', UserSchema);