import { Stage } from '../core/Stage';
import { PipelineContext } from '../core/PipelineContext';
import { env } from '../../config/env';

/**
 * Compression Stage - compresses the output image
 * Supports:
 *   - JPEG quality control
 *   - PNG compression level
 *   - WebP format conversion
 */
export class CompressionStage extends Stage {
  constructor(enabled: boolean = true) {
    super('CompressionStage', enabled, 1);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error('No Sharp instance available. InputStage must run first.');
    }

    const compressionOptions = context.options.compression;
    const format = compressionOptions?.format || 'jpeg';
    const quality = compressionOptions?.quality || env.defaultQuality;

    switch (format) {
      case 'jpeg':
        context.sharpInstance = context.sharpInstance.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
        context.metadata.format = 'jpeg';
        break;

      case 'png':
        context.sharpInstance = context.sharpInstance.png({
          compressionLevel: Math.min(9, Math.floor((100 - quality) / 11)),
          progressive: true,
        });
        context.metadata.format = 'png';
        break;

      case 'webp':
        context.sharpInstance = context.sharpInstance.webp({
          quality,
          effort: 4,
        });
        context.metadata.format = 'webp';
        break;

      default:
        throw new Error(`Unsupported output format: ${format}`);
    }

    return context;
  }
}
