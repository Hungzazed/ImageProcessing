export type ChannelType = 'webhook' | 'email';

export interface ISubscription {
  id?: string;
  userId: string;
  channel: ChannelType;
  destination: string; // URL for webhook or email address
  events: string[]; // List of event types
  filters?: {
    jobId?: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
