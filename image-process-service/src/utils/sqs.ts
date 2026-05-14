import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env";

const sqsClient = new SQSClient({
  region: env.s3Region,
  credentials:
    env.awsAccessKeyId && env.awsSecretAccessKey
      ? {
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
        }
      : undefined,
  endpoint: env.sqsEndpoint || undefined,
});

export async function sendSqsMessage(messageBody: object): Promise<void> {
  if (!env.sqsQueueUrl) {
    throw new Error("SQS_QUEUE_URL is required for sending messages");
  }

  const command = new SendMessageCommand({
    QueueUrl: env.sqsQueueUrl,
    MessageBody: JSON.stringify(messageBody),
  });

  await sqsClient.send(command);
}
