import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { ImageController } from './image.controller';
import { env } from '../../config/env';
import { ensureDir } from '../../utils/file';

// Ensure upload directory exists
ensureDir(env.uploadDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter to allow only images
const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (env.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: ${env.allowedMimeTypes.join(', ')}`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSize,
  },
});

const router = Router();
const controller = new ImageController();

/**
 * POST /api/images/process
 * Upload and process an image through the pipeline
 */
router.post('/process', upload.single('image'), controller.processImage);

export default router;
