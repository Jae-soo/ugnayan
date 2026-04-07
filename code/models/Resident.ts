import mongoose, { Schema, type Document } from 'mongoose';

export interface IResident extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email?: string;
  phone: string;
  fullName: string;
  address: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema: Schema = new Schema(
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
    phone: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Resident || mongoose.model<IResident>('Resident', ResidentSchema);

