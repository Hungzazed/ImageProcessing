import sharp from 'sharp';
import {
  ImageProcessingOptions,
  ImageMetadata,
  PipelineLog,
  PipelineError,
} from '../../types/image.types';

/**
 * PipelineContext carries all data through the pipeline stages.
 * Each stage reads from and writes to this shared context.
 */
export class PipelineContext {
  public inputPath?: string;
  public inputBuffer?: Buffer;
  public inputMimeType?: string;
  public originalName?: string;
  public outputUrl: string;
  public s3Key: string;
  public filename: string;
  public metadata: ImageMetadata;
  public sharpInstance: sharp.Sharp | null;
  public options: ImageProcessingOptions;
  public logs: PipelineLog[];
  public errors: PipelineError[];
  public startTime: number;

  constructor(
    input: {
      path?: string;
      buffer?: Buffer;
      mimeType?: string;
      originalName?: string;
    },
    options: ImageProcessingOptions = {}
  ) {
    this.inputPath = input.path;
    this.inputBuffer = input.buffer;
    this.inputMimeType = input.mimeType;
    this.originalName = input.originalName;
    this.outputUrl = '';
    this.s3Key = '';
    this.filename = '';
    this.metadata = {};
    this.sharpInstance = null;
    this.options = options;
    this.logs = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  /**
   * Add a log entry to the context
   */
  addLog(stage: string, status: PipelineLog['status'], message: string, duration?: number): void {
    this.logs.push({
      stage,
      status,
      message,
      timestamp: new Date(),
      duration,
    });
  }

  /**
   * Add an error entry to the context
   */
  addError(stage: string, message: string, stack?: string): void {
    this.errors.push({
      stage,
      message,
      timestamp: new Date(),
      stack,
    });
  }

  /**
   * Get total processing time in milliseconds
   */
  getProcessingTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Check if the pipeline has any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
