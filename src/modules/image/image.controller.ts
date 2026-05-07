import { Request, Response } from 'express';
import { ImageService } from './image.service';
import { ImageProcessingOptions } from '../../types/image.types';
import { logger } from '../../utils/logger';
import sharp from 'sharp';

/**
 * Image Controller - handles HTTP requests for image processing
 */
export class ImageController {
  private imageService: ImageService;

  constructor() {
    this.imageService = new ImageService();
  }

  /**
   * POST /api/images/process
   * Process an uploaded image through the pipeline
   */
  processImage = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate file upload
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No image file uploaded. Use field name "image".',
        });
        return;
      }

      // Parse processing options from request body
      const options: ImageProcessingOptions = this.parseOptions(req);

      logger.info(`Received image processing request: ${req.file.originalname}`);

      // Process the image
      const result = await this.imageService.processImage(
        req.file.path,
        options
      );

      res.status(200).json({
        success: true,
        data: {
          outputPath: `/outputs/${result.filename}`,
          filename: result.filename,
          metadata: result.metadata,
          logs: result.logs,
          processingTime: `${result.processingTime}ms`,
        },
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`Image processing failed: ${err.message}`);

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };

  /**
   * Parse processing options from multipart form data
   */
  private parseOptions(req: Request): ImageProcessingOptions {
    const options: ImageProcessingOptions = {};

    // Resize options
    const width = req.body.width ? parseInt(req.body.width, 10) : undefined;
    const height = req.body.height ? parseInt(req.body.height, 10) : undefined;
    const fit = req.body.fit as keyof sharp.FitEnum | undefined;

    if (width || height) {
      options.resize = { width, height, fit: fit || 'cover' };
    }

    // Filter options
    if (req.body.filter) {
      options.filter = {
        type: req.body.filter,
        value: req.body.filterValue ? parseFloat(req.body.filterValue) : undefined,
      };
    }

    // Watermark options
    if (req.body.watermarkText) {
      options.watermark = {
        type: 'text',
        text: req.body.watermarkText,
        position: req.body.watermarkPosition || 'bottom-right',
        opacity: req.body.watermarkOpacity
          ? parseFloat(req.body.watermarkOpacity)
          : undefined,
        fontSize: req.body.watermarkFontSize
          ? parseInt(req.body.watermarkFontSize, 10)
          : undefined,
      };
    }

    // Compression options
    const quality = req.body.quality ? parseInt(req.body.quality, 10) : undefined;
    const format = req.body.format as 'jpeg' | 'png' | 'webp' | undefined;

    options.compression = {
      format: format || 'jpeg',
      quality: quality || 80,
    };

    return options;
  }
}
