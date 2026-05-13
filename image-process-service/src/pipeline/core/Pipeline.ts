import { Stage } from './Stage';
import { PipelineContext } from './PipelineContext';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Pipeline Engine - orchestrates the sequential execution of stages.
 * Supports dynamic composition, event-driven notifications, and metrics.
 */
export class Pipeline extends EventEmitter {
  private stages: Stage[] = [];
  private readonly name: string;

  constructor(name: string = 'ImagePipeline') {
    super();
    this.name = name;
  }

  /**
   * Add a stage to the pipeline
   */
  addStage(stage: Stage): Pipeline {
    this.stages.push(stage);
    return this; // Allow chaining
  }

  /**
   * Remove a stage by name
   */
  removeStage(stageName: string): Pipeline {
    this.stages = this.stages.filter((s) => s.name !== stageName);
    return this;
  }

  /**
   * Enable a specific stage by name
   */
  enableStage(stageName: string): Pipeline {
    const stage = this.stages.find((s) => s.name === stageName);
    if (stage) stage.enabled = true;
    return this;
  }

  /**
   * Disable a specific stage by name
   */
  disableStage(stageName: string): Pipeline {
    const stage = this.stages.find((s) => s.name === stageName);
    if (stage) stage.enabled = false;
    return this;
  }

  /**
   * Get all registered stages
   */
  getStages(): Stage[] {
    return [...this.stages];
  }

  /**
   * Execute all stages sequentially
   */
  async execute(context: PipelineContext): Promise<PipelineContext> {
    logger.info(`🚀 Pipeline "${this.name}" started with ${this.stages.length} stages`);
    this.emit('pipeline:start', { name: this.name, stageCount: this.stages.length });

    const startTime = Date.now();

    for (const stage of this.stages) {
      this.emit('stage:before', { stageName: stage.name });

      try {
        context = await stage.execute(context);
        this.emit('stage:after', { stageName: stage.name, success: true });
      } catch (error) {
        this.emit('stage:after', { stageName: stage.name, success: false, error });
        logger.error(`Pipeline halted at stage: ${stage.name}`);
        break;
      }
    }

    const totalTime = Date.now() - startTime;
    const metrics = {
      name: this.name,
      totalTime,
      stagesExecuted: context.logs.filter((l) => l.status === 'completed').length,
      stagesSkipped: context.logs.filter((l) => l.status === 'skipped').length,
      stagesFailed: context.logs.filter((l) => l.status === 'failed').length,
      errors: context.errors.length,
    };

    logger.info(`✅ Pipeline "${this.name}" completed in ${totalTime}ms`);
    logger.info(`📊 Metrics: ${JSON.stringify(metrics)}`);
    this.emit('pipeline:end', metrics);

    return context;
  }
}
