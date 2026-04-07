import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['ServiceRequest', 'Report', 'Announcement', 'Reply', 'System'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: { // ID of the request/report/announcement
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
