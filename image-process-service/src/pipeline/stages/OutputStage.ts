import path from 'path';
import crypto from 'crypto';
import { Stage } from '../core/Stage';
import { PipelineContext } from '../core/PipelineContext';
import { env } from '../../config/env';
import { ensureDir, getFileSize } from '../../utils/file';

/**
 * Output Stage - saves the processed image to disk
 * Responsibilities:
 *   - Generate unique filename
 *   - Ensure output directory exists
 *   - Save file to outputs/
 *   - Update context with output path
 */
export class OutputStage extends Stage {
  constructor(enabled: boolean = true) {
    super('OutputStage', enabled, 1);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error('No Sharp instance available. InputStage must run first.');
    }

    // Ensure output directory exists
    ensureDir(env.outputDir);

    // Generate unique filename
    const format = context.metadata.format || 'jpeg';
    const ext = format === 'jpeg' ? 'jpg' : format;
    const uniqueFilename = `${crypto.randomUUID()}.${ext}`;
    const outputPath = path.join(env.outputDir, uniqueFilename);

    // Save the processed image
    await context.sharpInstance.toFile(outputPath);

    // Update context
    context.outputPath = outputPath;
    context.filename = uniqueFilename;

    // Update metadata with final file info
    const finalSize = getFileSize(outputPath);
    context.metadata.size = finalSize;

    return context;
  }
}
