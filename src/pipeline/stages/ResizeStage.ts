import { Stage } from "../core/Stage";
import { PipelineContext } from "../core/PipelineContext";
import { env } from "../../config/env";
import sharp from "sharp";

/**
 * Resize Stage - resizes the image based on options
 * Supports width, height, and fit mode
 */
export class ResizeStage extends Stage {
  constructor(enabled: boolean = true) {
    super("ResizeStage", enabled, 1);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error(
        "No Sharp instance available. InputStage must run first.",
      );
    }

    const resizeOptions = context.options.resize;

    // Use options if provided, otherwise use defaults
    const width = resizeOptions?.width || env.defaultWidth;
    const height = resizeOptions?.height || env.defaultHeight;
    const fit = resizeOptions?.fit || "inside";

    context.sharpInstance = context.sharpInstance.resize({
      width,
      height,
      fit,
      withoutEnlargement: true,
    });

    // ✅ Materialize buffer để lấy kích thước THỰC TẾ sau resize
    const buffer = await context.sharpInstance.toBuffer();
    context.sharpInstance = sharp(buffer);

    // ✅ Ghi metadata THỰC TẾ, không phải target
    const actualMeta = await context.sharpInstance.metadata();
    context.metadata.width = actualMeta.width!;
    context.metadata.height = actualMeta.height!;

    return context;
  }
}
