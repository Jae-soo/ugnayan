import mongoose, { Schema, type Document } from 'mongoose';

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  category: string;
  description: string;
  location?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'pending' | 'in-progress' | 'resolved' | 'rejected';
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: false,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterEmail: {
      type: String,
      required: true,
    },
    reporterPhone: {
      type: String,
      required: false,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'pending', 'in-progress', 'resolved', 'rejected'],
      default: 'open',
    },
    response: {
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

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
