import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { ensureDir } from './utils/file';

// Ensure required directories exist
ensureDir(env.uploadDir);
ensureDir(env.outputDir);

// Start server
const server = app.listen(env.port, () => {
  logger.info(`🖼️  Image Processing Service started`);
  logger.info(`📍 Environment: ${env.nodeEnv}`);
  logger.info(`🚪 Port: ${env.port}`);
  logger.info(`📂 Upload dir: ${env.uploadDir}`);
  logger.info(`📁 Output dir: ${env.outputDir}`);
  logger.info(`📏 Max file size: ${env.maxFileSize} bytes`);
  logger.info(`🔗 API: http://localhost:${env.port}/api/images/process`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

export default server;
