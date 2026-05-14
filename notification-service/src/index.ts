import express from 'express';
import { config } from './config/env';
import { connectDB } from './infrastructure/database/mongoose';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';
import { routes } from './presentation/api/routes';

const app = express();
app.use(express.json());

// API Routes
app.use('/api', routes);

const start = async () => {
  // Connect to DB
  await connectDB();

  // Start Kafka Consumer
  const kafkaConsumer = new KafkaConsumer();
  await kafkaConsumer.connect();

  // Start Express Server
  app.listen(config.port, () => {
    console.log(`Notification Service is running on port ${config.port}`);
  });
};

start();
