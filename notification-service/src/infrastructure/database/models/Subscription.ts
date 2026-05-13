import mongoose, { Schema, Document } from 'mongoose';
import { ISubscription } from '../../domain/entities/Subscription';

export interface SubscriptionDocument extends Omit<ISubscription, 'id'>, Document {}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    channel: { type: String, enum: ['webhook', 'email'], required: true },
    destination: { type: String, required: true },
    events: { type: [String], required: true },
    filters: {
      jobId: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionModel = mongoose.model<SubscriptionDocument>('Subscription', SubscriptionSchema);
