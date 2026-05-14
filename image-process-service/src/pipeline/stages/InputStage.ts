import sharp from 'sharp';
import path from 'path';
import { Stage } from '../core/Stage';
import { PipelineContext } from '../core/PipelineContext';
import { env } from '../../config/env';
import { fileExists, getFileSize } from '../../utils/file';

/**
 * Input Stage - validates and loads the input image
 * Responsibilities:
 *   - Validate file existence
 *   - Validate file type (MIME)
 *   - Validate file size
 *   - Load image with Sharp
 *   - Extract metadata
 */
export class InputStage extends Stage {
  constructor(enabled: boolean = true) {
    super('InputStage', enabled, 0);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    const { inputPath, inputBuffer, inputMimeType, originalName } = context;

    if (inputBuffer) {
      const fileSize = inputBuffer.length;
      if (fileSize > env.maxFileSize) {
        throw new Error(
          `File size ${fileSize} exceeds maximum allowed size ${env.maxFileSize} bytes`
        );
      }

      if (inputMimeType && !env.allowedMimeTypes.includes(inputMimeType)) {
        throw new Error(
          `Unsupported file type: ${inputMimeType}. Allowed: ${env.allowedMimeTypes.join(', ')}`
        );
      }

      if (!inputMimeType && originalName) {
        const ext = path.extname(originalName).toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        if (!allowedExts.includes(ext)) {
          throw new Error(
            `Unsupported file type: ${ext}. Allowed: ${allowedExts.join(', ')}`
          );
        }
      }

      const sharpInstance = sharp(inputBuffer);
      const metadata = await sharpInstance.metadata();

      context.sharpInstance = sharpInstance;
      context.filename = originalName || '';
      context.metadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: fileSize,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        originalName,
      };

      return context;
    }

    if (!inputPath) {
      throw new Error('No input provided. Provide an in-memory buffer or a file path.');
    }

    // Fallback: legacy file-path flow
    if (!fileExists(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const fileSize = getFileSize(inputPath);
    if (fileSize > env.maxFileSize) {
      throw new Error(
        `File size ${fileSize} exceeds maximum allowed size ${env.maxFileSize} bytes`
      );
    }

    const ext = path.extname(inputPath).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!allowedExts.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}. Allowed: ${allowedExts.join(', ')}`);
    }

    const sharpInstance = sharp(inputPath);
    const metadata = await sharpInstance.metadata();

    context.sharpInstance = sharpInstance;
    context.filename = path.basename(inputPath);
    context.metadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: fileSize,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      originalName: path.basename(inputPath),
    };

    return context;
  }
}
