import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/notification-db",
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    notificationQueueName: process.env.NOTIFICATION_QUEUE_NAME || "image-pipeline-app-dev-notification-queue",
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "noreply@example.com",
  },
  retryLimit: parseInt(process.env.WEBHOOK_RETRY_LIMIT || "3"),
};
