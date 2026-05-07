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

    // Lấy kích thước gốc
    const originalMeta = await context.sharpInstance.metadata();
    const originalWidth = originalMeta.width!;
    const originalHeight = originalMeta.height!;

    // Không truyền gì → giữ nguyên
    if (!resizeOptions?.width && !resizeOptions?.height) {
      context.metadata.width = originalWidth;
      context.metadata.height = originalHeight;
      return context;
    }

    // Truyền 1 → lấy chiều còn lại từ ảnh gốc
    const width = resizeOptions.width || originalWidth;
    const height = resizeOptions.height || originalHeight;
    const fit = resizeOptions.fit || "cover";

    context.sharpInstance = context.sharpInstance.resize({
      width,
      height,
      fit,
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
