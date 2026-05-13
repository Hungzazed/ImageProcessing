import express from 'express';
import path from 'path';
import imageRoutes from './modules/image/image.route';
import { env } from './config/env';
import { logger } from './utils/logger';
import { ensureDir } from './utils/file';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const publicDir = path.resolve(process.cwd(), 'public');
ensureDir(publicDir);
app.use(express.static(publicDir));

// Serve static output files
ensureDir(env.outputDir);
app.use('/outputs', express.static(env.outputDir));

// API Routes
app.use('/api/images', imageRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(`Unhandled error: ${err.message}`);

    // Handle multer errors
    if (err.message.includes('Unsupported file type')) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
      return;
    }

    if (err.message.includes('File too large')) {
      res.status(400).json({
        success: false,
        error: `File size exceeds maximum limit of ${env.maxFileSize} bytes`,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
);

export default app;
