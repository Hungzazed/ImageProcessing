import { Pipeline } from '../core/Pipeline';
import { InputStage } from '../stages/InputStage';
import { ResizeStage } from '../stages/ResizeStage';
import { FilterStage } from '../stages/FilterStage';
import { WatermarkStage } from '../stages/WatermarkStage';
import { CompressionStage } from '../stages/CompressionStage';
import { OutputStage } from '../stages/OutputStage';
import { PipelineConfig } from '../../types/image.types';

/**
 * ImagePipelineBuilder - uses Builder Pattern to construct pipelines.
 * Allows config-based or programmatic pipeline composition.
 */
export class ImagePipelineBuilder {
  private pipeline: Pipeline;
  private stageMap: Map<string, () => any>;

  constructor(pipelineName: string = 'ImagePipeline') {
    this.pipeline = new Pipeline(pipelineName);
    this.stageMap = new Map();

    // Register available stages
    this.stageMap.set('InputStage', () => new InputStage());
    this.stageMap.set('ResizeStage', () => new ResizeStage());
    this.stageMap.set('FilterStage', () => new FilterStage());
    this.stageMap.set('WatermarkStage', () => new WatermarkStage());
    this.stageMap.set('CompressionStage', () => new CompressionStage());
    this.stageMap.set('OutputStage', () => new OutputStage());
  }

  /**
   * Build pipeline with all default stages
   */
  withAllStages(): ImagePipelineBuilder {
    this.pipeline.addStage(new InputStage());
    this.pipeline.addStage(new ResizeStage());
    this.pipeline.addStage(new FilterStage());
    this.pipeline.addStage(new WatermarkStage());
    this.pipeline.addStage(new CompressionStage());
    this.pipeline.addStage(new OutputStage());
    return this;
  }

  /**
   * Add input stage
   */
  withInput(): ImagePipelineBuilder {
    this.pipeline.addStage(new InputStage());
    return this;
  }

  /**
   * Add resize stage
   */
  withResize(enabled: boolean = true): ImagePipelineBuilder {
    this.pipeline.addStage(new ResizeStage(enabled));
    return this;
  }

  /**
   * Add filter stage
   */
  withFilter(enabled: boolean = true): ImagePipelineBuilder {
    this.pipeline.addStage(new FilterStage(enabled));
    return this;
  }

  /**
   * Add watermark stage
   */
  withWatermark(enabled: boolean = true): ImagePipelineBuilder {
    this.pipeline.addStage(new WatermarkStage(enabled));
    return this;
  }

  /**
   * Add compression stage
   */
  withCompression(enabled: boolean = true): ImagePipelineBuilder {
    this.pipeline.addStage(new CompressionStage(enabled));
    return this;
  }

  /**
   * Add output stage
   */
  withOutput(): ImagePipelineBuilder {
    this.pipeline.addStage(new OutputStage());
    return this;
  }

  /**
   * Build pipeline from configuration object
   */
  fromConfig(config: PipelineConfig): ImagePipelineBuilder {
    // Sort stages by order
    const sortedStages = [...config.stages].sort((a, b) => a.order - b.order);

    for (const stageConfig of sortedStages) {
      const stageFactory = this.stageMap.get(stageConfig.name);
      if (stageFactory) {
        const stage = stageFactory();
        stage.enabled = stageConfig.enabled;
        this.pipeline.addStage(stage);
      }
    }

    return this;
  }

  /**
   * Build and return the pipeline
   */
  build(): Pipeline {
    return this.pipeline;
  }
}
