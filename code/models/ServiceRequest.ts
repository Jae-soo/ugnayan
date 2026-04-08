import mongoose, { Schema, type Document } from 'mongoose';

export interface IServiceRequest extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'document' | 'service' | 'complaint' | 'emergency' | 'landslide' | 'flooding' | 'road-issue' | 'other';
  description: string;
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  residentAddress?: string;
  documentType?: string;
  purpose?: string;
  complaintType?: string;
  additionalInfo?: string;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'rejected' | 'resolved' | 'open';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
  idPicture?: string;
}

const ServiceRequestSchema: Schema = new Schema(
  {
    type: {
      type: String,
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
    location: {
      type: String,
      required: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
