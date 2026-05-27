import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import { config } from '../../config/env.js';
import { ProcessEvent } from '../../application/use-cases/ProcessEvent.js';

export class SQSConsumer {
  private sqs: SQSClient;
  private queueName: string;
  private queueUrl: string | undefined;
  private processEvent = new ProcessEvent();
  private isRunning = false;

  constructor() {
    this.sqs = new SQSClient({ region: config.aws.region });
    this.queueName = config.aws.notificationQueueName;
  }

  async start(): Promise<void> {
    if (!this.queueName) {
      console.warn('NOTIFICATION_QUEUE_NAME is not set. SQS Consumer will not start.');
      return;
    }

    this.isRunning = true;
    console.log(`SQS Consumer starting, resolving queue: ${this.queueName}...`);

    try {
      const response = await this.sqs.send(new GetQueueUrlCommand({
        QueueName: this.queueName,
      }));
      this.queueUrl = response.QueueUrl;
      console.log(`Successfully resolved SQS Queue URL: ${this.queueUrl}`);
    } catch (err: any) {
      console.error(`Failed to resolve SQS Queue URL for queue name "${this.queueName}":`, err.message);
      this.isRunning = false;
      return;
    }

    while (this.isRunning && this.queueUrl) {
      try {
        const response = await this.sqs.send(new ReceiveMessageCommand({
          QueueUrl: this.queueUrl!,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20, // Long polling to minimize request costs
        }));

        if (!response.Messages || response.Messages.length === 0) {
          continue;
        }

        for (const message of response.Messages) {
          if (!this.isRunning) break;

          try {
            if (message.Body) {
              const eventData = JSON.parse(message.Body);
              await this.processEvent.execute(eventData);
            }

            // Delete message from queue after processing successfully
            await this.sqs.send(new DeleteMessageCommand({
              QueueUrl: this.queueUrl!,
              ReceiptHandle: message.ReceiptHandle!,
            }));
          } catch (err: any) {
            console.error('Error processing single SQS message:', err.message);
            // We do NOT delete the message here so SQS will make it visible again after VisibilityTimeout
          }
        }
      } catch (err: any) {
        console.error('Error polling SQS messages:', err.message);
        // Wait 5 seconds before next poll to avoid spamming on persistent connection issues
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log('SQS Consumer stopped.');
  }
}
