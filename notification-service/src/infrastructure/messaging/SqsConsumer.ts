import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { config } from "../../config/env.js";
import { ProcessEvent } from "../../application/use-cases/ProcessEvent.js";

export class SqsConsumer {
  private client = new SQSClient({
    region: config.aws.region,
    ...(config.aws.accessKeyId && config.aws.secretAccessKey
      ? {
          credentials: {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
          },
        }
      : {}),

    ...(config.aws.sqsEndpoint
      ? {
          endpoint: config.aws.sqsEndpoint,
        }
      : {}),
  });
  private processEvent = new ProcessEvent();
  private isRunning = false;

  async start(): Promise<void> {
    if (!config.aws.sqsQueueUrl) {
      throw new Error("SQS_QUEUE_URL is required to start SqsConsumer");
    }

    this.isRunning = true;
    while (this.isRunning) {
      try {
        const receiveCommand = new ReceiveMessageCommand({
          QueueUrl: config.aws.sqsQueueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 30,
        });

        const response = await this.client.send(receiveCommand);
        const messages = response.Messages || [];

        if (messages.length === 0) {
          continue;
        }

        for (const message of messages) {
          if (!message.Body || !message.ReceiptHandle) {
            continue;
          }

          try {
            const eventData = JSON.parse(message.Body);
            await this.processEvent.execute(eventData);

            const deleteCommand = new DeleteMessageCommand({
              QueueUrl: config.aws.sqsQueueUrl,
              ReceiptHandle: message.ReceiptHandle,
            });
            await this.client.send(deleteCommand);
          } catch (err) {
            console.error("Error processing SQS message", err);
          }
        }
      } catch (err) {
        console.error("SQS receive error", err);
      }
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}
