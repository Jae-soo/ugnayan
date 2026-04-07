import mongoose, { Schema, type Document } from 'mongoose';

export interface IServiceRequest extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'document' | 'service' | 'complaint';
  description: string;
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  residentAddress?: string;
  documentType?: string;
  purpose?: string;
  complaintType?: string;
  additionalInfo?: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['document', 'service', 'complaint'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    residentName: {
      type: String,
      required: true,
    },
    residentEmail: {
      type: String,
      required: true,
    },
    residentPhone: {
      type: String,
      required: true,
    },
    residentAddress: {
      type: String,
      required: false,
    },
    documentType: {
      type: String,
      required: false,
    },
    purpose: {
      type: String,
      required: false,
    },
    complaintType: {
      type: String,
      required: false,
    },
    additionalInfo: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'ready', 'completed', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      required: false,
    },
    idPicture: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
