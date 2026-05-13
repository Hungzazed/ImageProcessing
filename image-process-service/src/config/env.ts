import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: process.env.NODE_ENV === "development" ? ".env.local" : ".env",
});

export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || "outputs"),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB
  allowedMimeTypes: (
    process.env.ALLOWED_MIME_TYPES ||
    "image/jpeg,image/png,image/webp,image/gif"
  ).split(","),
  defaultQuality: parseInt(process.env.DEFAULT_QUALITY || "80", 10),
  defaultWidth: parseInt(process.env.DEFAULT_WIDTH || "800", 10),
  defaultHeight: parseInt(process.env.DEFAULT_HEIGHT || "600", 10),
  watermarkFontSize: parseInt(process.env.WATERMARK_FONT_SIZE || "24", 10),
  watermarkOpacity: parseFloat(process.env.WATERMARK_OPACITY || "0.5"),
  logLevel: process.env.LOG_LEVEL || "info",
};
