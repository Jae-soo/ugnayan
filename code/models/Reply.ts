import mongoose, { Schema, type Document } from 'mongoose';

export interface IReply extends Document {
  referenceId: string;
  type: 'service-request' | 'report' | 'blotter';
  officialName: string;
  officialRole: string;
  message: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  attachments?: Array<{
    name: string;
    type: string;
    dataUrl: string;
  }>;
  createdAt: Date;
}

const ReplySchema: Schema = new Schema(
  {
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['service-request', 'report', 'blotter'],
      required: true,
    },
    officialName: {
      type: String,
      required: true,
    },
    officialRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    recipientEmail: String,
    recipientPhone: String,
    recipientName: String,
    attachments: [
      {
        name: String,
        type: String,
        dataUrl: String,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.models.Reply || mongoose.model<IReply>('Reply', ReplySchema);
