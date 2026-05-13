export interface EventData {
  jobId: string;
  imageId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface IEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  data: EventData;
}
