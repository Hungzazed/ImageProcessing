import { Stage } from "../core/Stage";
import { PipelineContext } from "../core/PipelineContext";

/**
 * Filter Stage - applies visual filters to the image
 * Supported filters:
 *   - grayscale: convert to grayscale
 *   - sepia: apply sepia tone (via tint)
 *   - blur: Gaussian blur with configurable sigma
 *   - brightness: adjust brightness via modulate
 *
 * Designed for easy extension with new filters.
 */
export class FilterStage extends Stage {
  // Registry of filter functions for extensibility
  private static filterRegistry: Map<
    string,
    (context: PipelineContext, value?: number) => void
  > = new Map();

  constructor(enabled: boolean = true) {
    super("FilterStage", enabled, 1);
    this.registerDefaultFilters();
  }

  /**
   * Register built-in filters
   */
  private registerDefaultFilters(): void {
    FilterStage.filterRegistry.set("grayscale", (context) => {
      context.sharpInstance = context.sharpInstance!.grayscale();
    });

    FilterStage.filterRegistry.set("sepia", (context) => {
      // Sepia effect: grayscale + tint with warm tone
      context.sharpInstance = context
        .sharpInstance!.grayscale()
        .tint({ r: 112, g: 66, b: 20 });
    });

    FilterStage.filterRegistry.set("blur", (context, value) => {
      const sigma = value || 3;
      context.sharpInstance = context.sharpInstance!.blur(sigma);
    });

    FilterStage.filterRegistry.set("brightness", (context, value) => {
      const brightnessValue = value || 1.2;
      context.sharpInstance = context.sharpInstance!.modulate({
        brightness: brightnessValue,
      });
    });
  }

  /**
   * Register a custom filter (extensibility point)
   */
  static registerFilter(
    name: string,
    handler: (context: PipelineContext, value?: number) => void,
  ): void {
    FilterStage.filterRegistry.set(name, handler);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error(
        "No Sharp instance available. InputStage must run first.",
      );
    }

    const filterOptions = context.options.filter;
    if (!filterOptions) {
      context.addLog(this.name, "skipped", "No filter options provided");
      return context;
    }

    const handler = FilterStage.filterRegistry.get(filterOptions.type);
    if (!handler) {
      throw new Error(
        `Unknown filter type: ${filterOptions.type}. Available: ${Array.from(
          FilterStage.filterRegistry.keys(),
        ).join(", ")}`,
      );
    }

    handler(context, filterOptions.value);

    return context;
  }
}
