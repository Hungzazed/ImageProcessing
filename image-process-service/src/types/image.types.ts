import sharp from 'sharp';

/**
 * Image processing options passed through the pipeline
 */
export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
  };
  filter?: {
    type: 'grayscale' | 'sepia' | 'blur' | 'brightness';
    value?: number;
  };
  watermark?: {
    type: 'text' | 'image';
    text?: string;
    imagePath?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
    fontSize?: number;
  };
  compression?: {
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
}

/**
 * Image metadata extracted during processing
 */
export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  channels?: number;
  hasAlpha?: boolean;
  originalName?: string;
}

/**
 * Log entry for pipeline execution tracking
 */
export interface PipelineLog {
  stage: string;
  status: 'started' | 'completed' | 'skipped' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number;
}

/**
 * Pipeline execution error
 */
export interface PipelineError {
  stage: string;
  message: string;
  timestamp: Date;
  stack?: string;
}

/**
 * API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: PipelineError[];
}

/**
 * Image processing result
 */
export interface ImageProcessingResult {
  outputPath: string;
  filename: string;
  metadata: ImageMetadata;
  logs: PipelineLog[];
  processingTime: number;
}

/**
 * Pipeline stage configuration
 */
export interface StageConfig {
  name: string;
  enabled: boolean;
  order: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Full pipeline configuration
 */
export interface PipelineConfig {
  stages: StageConfig[];
  parallel?: boolean;
  maxRetries?: number;
  timeout?: number;
}
