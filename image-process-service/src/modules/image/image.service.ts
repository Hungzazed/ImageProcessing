import { ImagePipelineBuilder } from '../../pipeline/builders/ImagePipelineBuilder';
import { PipelineContext } from '../../pipeline/core/PipelineContext';
import { ImageProcessingOptions, ImageProcessingResult } from '../../types/image.types';
import { logger } from '../../utils/logger';

/**
 * Image Service - business logic layer
 * Handles pipeline construction and execution
 */
export class ImageService {
  /**
   * Process a single image through the pipeline
   */
  async processImage(
    input: { buffer: Buffer; originalName: string; mimeType?: string },
    options: ImageProcessingOptions
  ): Promise<ImageProcessingResult> {
    logger.info(`Processing image: ${input.originalName}`);

    // Build the pipeline with all stages
    const pipeline = new ImagePipelineBuilder('ImageProcessing')
      .withAllStages()
      .build();

    // Create pipeline context
    const context = new PipelineContext(
      {
        buffer: input.buffer,
        originalName: input.originalName,
        mimeType: input.mimeType,
      },
      options
    );

    // Execute the pipeline
    const result = await pipeline.execute(context);

    // Check for critical errors (no output generated)
    if (!result.outputUrl) {
      throw new Error(
        `Pipeline failed to produce output. Errors: ${result.errors
          .map((e) => `[${e.stage}] ${e.message}`)
          .join('; ')}`
      );
    }

    return {
      outputUrl: result.outputUrl,
      s3Key: result.s3Key,
      filename: result.filename,
      metadata: result.metadata,
      logs: result.logs,
      processingTime: result.getProcessingTime(),
    };
  }

  /**
   * Process image with custom pipeline configuration
   */
  async processImageWithConfig(
    input: { buffer: Buffer; originalName: string; mimeType?: string },
    options: ImageProcessingOptions,
    stageOverrides?: { [stageName: string]: boolean }
  ): Promise<ImageProcessingResult> {
    logger.info(`Processing image with custom config: ${input.originalName}`);

    const builder = new ImagePipelineBuilder('CustomPipeline');

    // Build with selective stages
    builder.withInput();

    if (stageOverrides?.ResizeStage !== false && options.resize) {
      builder.withResize();
    }

    if (stageOverrides?.FilterStage !== false && options.filter) {
      builder.withFilter();
    }

    if (stageOverrides?.WatermarkStage !== false && options.watermark) {
      builder.withWatermark();
    }

    builder.withCompression();
    builder.withOutput();

    const pipeline = builder.build();
    const context = new PipelineContext(
      {
        buffer: input.buffer,
        originalName: input.originalName,
        mimeType: input.mimeType,
      },
      options
    );
    const result = await pipeline.execute(context);

    if (!result.outputUrl) {
      throw new Error(
        `Pipeline failed. Errors: ${result.errors
          .map((e) => `[${e.stage}] ${e.message}`)
          .join('; ')}`
      );
    }

    return {
      outputUrl: result.outputUrl,
      s3Key: result.s3Key,
      filename: result.filename,
      metadata: result.metadata,
      logs: result.logs,
      processingTime: result.getProcessingTime(),
    };
  }
}
