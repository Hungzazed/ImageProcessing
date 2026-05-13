Bạn là một Senior Backend Engineer chuyên về Node.js, TypeScript và kiến trúc Pipeline Pattern.

Hãy xây dựng một dự án Image Processing Service hoàn chỉnh bằng Node.js + TypeScript, sử dụng thư viện Sharp để xử lý ảnh, và áp dụng kiến trúc Pipeline Architecture.

# Mục tiêu hệ thống
Hệ thống cho phép upload ảnh và xử lý ảnh theo từng stage độc lập trong pipeline.

Pipeline gồm các stage:
1. Input Stage
2. Resize Stage
3. Filter Stage
4. Watermark Stage
5. Compression Stage
6. Output Stage

Mỗi stage phải hoạt động độc lập, dễ mở rộng, dễ thay đổi thứ tự và có thể bật/tắt bằng config.

# Yêu cầu kỹ thuật

## Công nghệ
- Node.js
- TypeScript
- Express.js
- Sharp
- Multer
- UUID
- dotenv

## Kiến trúc
Áp dụng Pipeline Pattern.

Mỗi stage:
- Chỉ có 1 trách nhiệm duy nhất
- Nhận input từ stage trước
- Trả output cho stage tiếp theo
- Không phụ thuộc trực tiếp vào stage khác

Pipeline phải:
- Có khả năng dynamic compose
- Có thể thêm stage mới dễ dàng
- Có thể enable/disable từng stage
- Có error handling riêng cho từng stage

# Thiết kế thư mục

Yêu cầu tạo cấu trúc thư mục chuẩn scalable như sau:

src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── pipeline/
│   ├── core/
│   │   ├── Pipeline.ts
│   │   ├── PipelineContext.ts
│   │   └── Stage.ts
│   ├── stages/
│   │   ├── InputStage.ts
│   │   ├── ResizeStage.ts
│   │   ├── FilterStage.ts
│   │   ├── WatermarkStage.ts
│   │   ├── CompressionStage.ts
│   │   └── OutputStage.ts
│   └── builders/
│       └── ImagePipelineBuilder.ts
├── modules/
│   └── image/
│       ├── image.controller.ts
│       ├── image.route.ts
│       └── image.service.ts
├── utils/
│   ├── logger.ts
│   └── file.ts
├── uploads/
├── outputs/
└── types/
    └── image.types.ts

# Yêu cầu code

## 1. Stage Interface
Tạo abstract class hoặc interface cho tất cả stages:

- execute(context): Promise<PipelineContext>

Mỗi stage phải implement execute.

## 2. PipelineContext
PipelineContext phải chứa:
- inputPath
- outputPath
- filename
- metadata
- sharpInstance
- options
- logs
- errors

## 3. Pipeline Engine
Tạo Pipeline class:
- addStage(stage)
- execute(context)

Pipeline phải chạy tuần tự từng stage.

## 4. Input Stage
- Validate file type
- Validate file size
- Load image bằng Sharp
- Đọc metadata

## 5. Resize Stage
Cho phép resize theo:
- width
- height
- fit

## 6. Filter Stage
Hỗ trợ:
- grayscale
- sepia
- blur
- brightness

Thiết kế để dễ thêm filter mới.

## 7. Watermark Stage
- Hỗ trợ text watermark
- Hỗ trợ image watermark
- Position:
  - top-left
  - top-right
  - bottom-left
  - bottom-right
  - center

## 8. Compression Stage
- JPEG quality
- PNG compression
- WebP support

## 9. Output Stage
- Generate unique filename
- Save file vào outputs/
- Trả URL hoặc path

# API yêu cầu

## POST /api/images/process

Multipart form-data:
- image
- width
- height
- filter
- quality
- watermarkText

Response:
{
  success: true,
  data: {
    outputPath: "...",
    filename: "...",
    metadata: {}
  }
}

# Error handling
- Tạo custom error classes
- Handle lỗi từng stage
- Log pipeline execution
- Không crash toàn bộ pipeline nếu 1 stage fail

# Bonus yêu cầu
Nếu có thể hãy implement:
- Parallel pipeline
- Queue processing
- Event-driven stages
- Retry mechanism
- Metrics logging
- Dependency Injection
- Config-based pipeline

# Output mong muốn
Hãy generate:
1. Full source code
2. Giải thích kiến trúc pipeline
3. Flow xử lý ảnh
4. Cách thêm stage mới
5. Cách chạy project
6. Ví dụ request API
7. Ví dụ response API
8. Giải thích vì sao Pipeline Pattern phù hợp
