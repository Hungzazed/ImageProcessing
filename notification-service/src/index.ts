import express from 'express';
import { config } from './config/env';
import { connectDB } from './infrastructure/database/mongoose';
import { SqsConsumer } from './infrastructure/messaging/SqsConsumer';
import { routes } from './presentation/api/routes';

const app = express();
app.use(express.json());

// API Routes
app.use('/api', routes);

const start = async () => {
  // Connect to DB
  await connectDB();

  // Start SQS Consumer
  const sqsConsumer = new SqsConsumer();
  sqsConsumer.start().catch((err) => {
    console.error('Failed to start SQS consumer', err);
  });

  // Start Express Server
  app.listen(config.port, () => {
    console.log(`Notification Service is running on port ${config.port}`);
  });
};

start();

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});
