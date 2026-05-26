import express from 'express';
import { config } from './config/env.js';
import { connectDB } from './infrastructure/database/mongoose.js';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer.js';
import { routes } from './presentation/api/routes.js';

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
