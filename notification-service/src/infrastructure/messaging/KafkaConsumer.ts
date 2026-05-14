import { Kafka } from 'kafkajs';
import { config } from '../../config/env.js';
import { ProcessEvent } from '../../application/use-cases/ProcessEvent.js';

export class KafkaConsumer {
  private kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
  });
  private consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
  private processEvent = new ProcessEvent();

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      console.log('Connected to Kafka successfully');

      // Subscribe to events
      await this.consumer.subscribe({ topic: 'image-processing-events', fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (message.value) {
            try {
              const eventData = JSON.parse(message.value.toString());
              await this.processEvent.execute(eventData);
            } catch (err) {
              console.error('Error processing message from Kafka', err);
            }
          }
        },
      });
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
