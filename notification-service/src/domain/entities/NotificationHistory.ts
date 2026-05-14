export type NotificationStatus = 'success' | 'failed' | 'pending';

export interface INotificationHistory {
  id?: string;
  subscriptionId: string;
  eventId: string;
  status: NotificationStatus;
  retryCount: number;
  lastError?: string;
  sentAt?: Date;
}
