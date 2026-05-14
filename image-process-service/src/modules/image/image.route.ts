import { Router } from 'express';
import multer from 'multer';
import { ImageController } from './image.controller';
import { env } from '../../config/env';
// Configure multer memory storage
const storage = multer.memoryStorage();

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
