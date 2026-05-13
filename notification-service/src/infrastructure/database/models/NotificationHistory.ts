import mongoose, { Schema, Document } from 'mongoose';
import { INotificationHistory } from '../../domain/entities/NotificationHistory';

export interface NotificationHistoryDocument extends Omit<INotificationHistory, 'id'>, Document {}

const NotificationHistorySchema: Schema = new Schema(
  {
    subscriptionId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], required: true, default: 'pending' },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const NotificationHistoryModel = mongoose.model<NotificationHistoryDocument>('NotificationHistory', NotificationHistorySchema);
