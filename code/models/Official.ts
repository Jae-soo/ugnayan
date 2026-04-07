import mongoose, { Schema, type Document } from 'mongoose';

export interface IOfficial extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email?: string;
  fullName: string;
  role: 'admin' | 'staff' | 'officer' | 'supervisor' | 'clerk' | string;
  createdAt: Date;
  updatedAt: Date;
}

const OfficialSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Official || mongoose.model<IOfficial>('Official', OfficialSchema);

