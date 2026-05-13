import { PipelineContext } from './PipelineContext';
import { logger } from '../../utils/logger';

/**
 * Abstract base class for all pipeline stages.
 * Each stage must implement the `process` method.
 * The `execute` method wraps `process` with logging, timing, and error handling.
 */
export abstract class Stage {
  public readonly name: string;
  public enabled: boolean;
  private retryCount: number;
  private retryDelay: number;

  constructor(name: string, enabled: boolean = true, retryCount: number = 0, retryDelay: number = 1000) {
    this.name = name;
    this.enabled = enabled;
    this.retryCount = retryCount;
    this.retryDelay = retryDelay;
  }

  /**
   * Template method: wraps the actual processing with lifecycle hooks
   */
  async execute(context: PipelineContext): Promise<PipelineContext> {
    if (!this.enabled) {
      logger.pipeline(this.name, 'skipped', 'Stage is disabled');
      context.addLog(this.name, 'skipped', 'Stage is disabled');
      return context;
    }

    const startTime = Date.now();
    logger.pipeline(this.name, 'started', `Processing...`);
    context.addLog(this.name, 'started', 'Stage started');

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        if (attempt > 0) {
          logger.pipeline(this.name, 'started', `Retry attempt ${attempt}/${this.retryCount}`);
          await this.delay(this.retryDelay);
        }

        const result = await this.process(context);
        const duration = Date.now() - startTime;

        logger.pipeline(this.name, 'completed', `Done in ${duration}ms`);
        context.addLog(this.name, 'completed', `Stage completed in ${duration}ms`, duration);

        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryCount) {
          logger.pipeline(this.name, 'started', `Failed, will retry: ${lastError.message}`);
        }
      }
    }

    // All retries exhausted
    const duration = Date.now() - startTime;
    const errorMessage = lastError?.message || 'Unknown error';

    logger.pipeline(this.name, 'failed', `${errorMessage} (${duration}ms)`);
    context.addLog(this.name, 'failed', errorMessage, duration);
    context.addError(this.name, errorMessage, lastError?.stack);

    return context;
  }

  /**
   * Abstract method that each stage must implement
   */
  protected abstract process(context: PipelineContext): Promise<PipelineContext>;

  /**
   * Helper to delay execution (for retry mechanism)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
