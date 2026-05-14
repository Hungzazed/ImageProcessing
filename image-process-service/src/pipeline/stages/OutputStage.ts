import crypto from 'crypto';
import { Stage } from '../core/Stage';
import { PipelineContext } from '../core/PipelineContext';
import { env } from '../../config/env';
import { uploadImageToS3 } from '../../utils/s3';

/**
 * Output Stage - uploads the processed image to S3
 * Responsibilities:
 *   - Generate unique filename
 *   - Upload to S3 bucket
 *   - Update context with S3 info
 */
export class OutputStage extends Stage {
  constructor(enabled: boolean = true) {
    super('OutputStage', enabled, 1);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error('No Sharp instance available. InputStage must run first.');
    }

    // Generate unique filename
    const format = context.metadata.format || 'jpeg';
    const ext = format === 'jpeg' ? 'jpg' : format;
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
    const prefix = env.s3KeyPrefix ? env.s3KeyPrefix.replace(/\/+$/, '') : '';
    const key = prefix ? `${prefix}/${uniqueFilename}` : uniqueFilename;

    // Export image to buffer and upload to S3
    const buffer = await context.sharpInstance.toBuffer();
    const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
    const uploaded = await uploadImageToS3(buffer, key, mimeType);

    // Update context
    context.outputUrl = uploaded.url;
    context.s3Key = uploaded.key;
    context.filename = uniqueFilename;

    // Update metadata with final file info
    context.metadata.size = buffer.length;

    return context;
  }
}
