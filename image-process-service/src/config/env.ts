import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "development" ? ".env.local" : ".env",
});

export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  allowedMimeTypes: (
    process.env.ALLOWED_MIME_TYPES ||
    "image/jpeg,image/png,image/webp,image/gif"
  ).split(","),
  defaultQuality: parseInt(process.env.DEFAULT_QUALITY || "80", 10),
  defaultWidth: parseInt(process.env.DEFAULT_WIDTH || "800", 10),
  defaultHeight: parseInt(process.env.DEFAULT_HEIGHT || "600", 10),
  watermarkFontSize: parseInt(process.env.WATERMARK_FONT_SIZE || "24", 10),
  watermarkOpacity: parseFloat(process.env.WATERMARK_OPACITY || "0.5"),
  logLevel: process.env.LOG_LEVEL || "info",
  s3Region:
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    "ap-southeast-1",
  s3Bucket: process.env.S3_BUCKET || "",
  awsAccessKeyId:
    process.env.AWS_ACCESS_KEY_ID || process.env.IAM_ACCESS_KEY_ID || "",
  awsSecretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.IAM_SECRET_ACCESS_KEY ||
    "",
  s3AccessKeyId:
    process.env.AWS_ACCESS_KEY_ID || process.env.IAM_ACCESS_KEY_ID || "",
  s3SecretAccessKey:
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.IAM_SECRET_ACCESS_KEY ||
    "",
  s3Endpoint: process.env.S3_ENDPOINT || "",
  s3KeyPrefix: process.env.S3_KEY_PREFIX || "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL || "",
  s3Acl: process.env.S3_ACL || "",
  sqsQueueUrl: process.env.SQS_QUEUE_URL || "",
  sqsEndpoint: process.env.SQS_ENDPOINT || "",
};
