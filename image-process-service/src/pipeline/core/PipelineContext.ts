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
  public inputPath: string;
  public outputPath: string;
  public filename: string;
  public metadata: ImageMetadata;
  public sharpInstance: sharp.Sharp | null;
  public options: ImageProcessingOptions;
  public logs: PipelineLog[];
  public errors: PipelineError[];
  public startTime: number;

  constructor(inputPath: string, options: ImageProcessingOptions = {}) {
    this.inputPath = inputPath;
    this.outputPath = '';
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
