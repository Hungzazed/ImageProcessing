import type { IEvent } from '../../domain/entities/Event.js';
import { SubscriptionModel } from '../../infrastructure/database/models/Subscription.js';
import { NotificationHistoryModel } from '../../infrastructure/database/models/NotificationHistory.js';
import { WebhookService } from '../../infrastructure/services/WebhookService.js';
import { EmailService } from '../../infrastructure/services/EmailService.js';
import { config } from '../../config/env.js';

export class ProcessEvent {
  private webhookService = new WebhookService();
  private emailService = new EmailService();

  async execute(event: IEvent): Promise<void> {
    console.log(`Processing event: ${event.eventType} - ${event.eventId}`);
    
    // Find matching subscriptions
    const query: any = {
      events: event.eventType,
      isActive: true,
    };
    
    // If the event has a userId, we might also filter by it, but typically a subscription
    // defines filters, and the event data has the actual values.
    // Let's fetch all subscriptions for this event type first, then filter in memory for complex filters
    // Or, if userId is a mandatory field for routing:
    if (event.data?.userId) {
      query.userId = event.data.userId;
    }

    const subscriptions = await SubscriptionModel.find(query);

    for (const sub of subscriptions) {
      // Check jobId filter if present
      if (sub.filters?.jobId && sub.filters.jobId !== event.data?.jobId) {
        continue;
      }

      await this.dispatchNotification(sub, event);
    }
  }

  private async dispatchNotification(subscription: any, event: IEvent) {
    const history = new NotificationHistoryModel({
      subscriptionId: subscription._id,
      eventId: event.eventId,
      status: 'pending',
    });
    await history.save();

    await this.sendWithRetry(subscription, event, history, 1);
  }

  private async sendWithRetry(subscription: any, event: IEvent, history: any, attempt: number) {
    try {
      if (subscription.channel === 'webhook') {
        await this.webhookService.send(subscription.destination, event);
      } else if (subscription.channel === 'email') {
        const subject = `Notification: ${event.eventType}`;
        const text = `Received event ${event.eventType} for Job ${event.data?.jobId}.\nData: ${JSON.stringify(event.data)}`;
        await this.emailService.send(subscription.destination, subject, text);
      }

      // Success
      history.status = 'success';
      history.retryCount = attempt;
      history.sentAt = new Date();
      await history.save();
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed for sub ${subscription._id}:`, error.message);
      
      if (attempt < config.retryLimit) {
        const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        setTimeout(() => {
          this.sendWithRetry(subscription, event, history, attempt + 1);
        }, backoffMs);
      } else {
        // Max retries reached -> DLQ
        history.status = 'failed';
        history.retryCount = attempt;
        history.lastError = error.message;
        await history.save();
        console.error(`DLQ: Notification failed after ${attempt} retries for sub ${subscription._id}`);
      }
    }
  }
}
