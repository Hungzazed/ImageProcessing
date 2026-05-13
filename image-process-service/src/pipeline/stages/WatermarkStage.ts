import sharp from "sharp";
import path from "path";
import { Stage } from "../core/Stage";
import { PipelineContext } from "../core/PipelineContext";
import { env } from "../../config/env";
import { fileExists } from "../../utils/file";

/**
 * Watermark Stage - adds text or image watermarks
 * Supports:
 *   - Text watermark with configurable font size and opacity
 *   - Image watermark overlay
 *   - 5 position options: top-left, top-right, bottom-left, bottom-right, center
 */
export class WatermarkStage extends Stage {
  constructor(enabled: boolean = true) {
    super("WatermarkStage", enabled, 1);
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error(
        "No Sharp instance available. InputStage must run first.",
      );
    }

    const watermarkOptions = context.options.watermark;
    if (!watermarkOptions) {
      context.addLog(this.name, "skipped", "No watermark options provided");
      return context;
    }

    if (watermarkOptions.type === "text") {
      await this.addTextWatermark(context);
    } else if (watermarkOptions.type === "image") {
      await this.addImageWatermark(context);
    }

    return context;
  }

  /**
   * Add a text watermark using SVG overlay
   */
  private async addTextWatermark(context: PipelineContext): Promise<void> {
    const { watermark } = context.options;
    if (!watermark?.text) {
      throw new Error("Watermark text is required for text watermark");
    }

    const fontSize = watermark.fontSize || env.watermarkFontSize;
    const opacity = watermark.opacity || env.watermarkOpacity;

    // Use context metadata (updated by ResizeStage) for correct dimensions
    const imgWidth = context.metadata.width || 800;
    const imgHeight = context.metadata.height || 600;

    // Calculate position
    const { x, y } = this.calculatePosition(
      watermark.position,
      imgWidth,
      imgHeight,
      watermark.text.length * fontSize * 0.6,
      fontSize * 1.5,
    );

    // Create SVG text overlay
    const svgText = `
      <svg width="${imgWidth}" height="${imgHeight}" viewBox="0 0 ${imgWidth} ${imgHeight}">
        <style>
          .watermark {
            fill: rgba(255, 255, 255, ${opacity});
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
          }
        </style>
        <text x="${x}" y="${y}" class="watermark">${this.escapeXml(watermark.text)}</text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgText);

    context.sharpInstance = context.sharpInstance!.composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ]);
  }

  /**
   * Add an image watermark overlay
   */
  private async addImageWatermark(context: PipelineContext): Promise<void> {
    const { watermark } = context.options;
    if (!watermark?.imagePath) {
      throw new Error("Watermark image path is required for image watermark");
    }

    if (!fileExists(watermark.imagePath)) {
      throw new Error(`Watermark image not found: ${watermark.imagePath}`);
    }

    const imgWidth = context.metadata.width || 800;
    const imgHeight = context.metadata.height || 600;

    // Resize watermark image to reasonable size (20% of main image)
    const watermarkWidth = Math.floor(imgWidth * 0.2);
    const watermarkBuffer = await sharp(watermark.imagePath)
      .resize(watermarkWidth)
      .toBuffer();

    const watermarkMeta = await sharp(watermarkBuffer).metadata();
    const wmWidth = watermarkMeta.width || watermarkWidth;
    const wmHeight = watermarkMeta.height || watermarkWidth;

    const { x, y } = this.calculatePosition(
      watermark.position,
      imgWidth,
      imgHeight,
      wmWidth,
      wmHeight,
    );

    context.sharpInstance = context.sharpInstance!.composite([
      {
        input: watermarkBuffer,
        top: Math.max(0, Math.floor(y)),
        left: Math.max(0, Math.floor(x)),
      },
    ]);
  }

  /**
   * Calculate watermark position based on placement option
   */
  private calculatePosition(
    position: string,
    imgWidth: number,
    imgHeight: number,
    wmWidth: number,
    wmHeight: number,
  ): { x: number; y: number } {
    const padding = 20;

    switch (position) {
      case "top-left":
        return { x: padding, y: padding + wmHeight };
      case "top-right":
        return { x: imgWidth - wmWidth - padding, y: padding + wmHeight };
      case "bottom-left":
        return { x: padding, y: imgHeight - padding };
      case "bottom-right":
        return { x: imgWidth - wmWidth - padding, y: imgHeight - padding };
      case "center":
        return {
          x: (imgWidth - wmWidth) / 2,
          y: (imgHeight + wmHeight) / 2,
        };
      default:
        return { x: padding, y: imgHeight - padding };
    }
  }

  /**
   * Escape special XML characters for SVG
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
