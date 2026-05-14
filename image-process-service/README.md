# 🖼️ Image Processing Service

> Hệ thống xử lý ảnh sử dụng **Pipeline Architecture** với Node.js + TypeScript + Sharp

## 📋 Mục lục

- [Kiến trúc Pipeline](#kiến-trúc-pipeline)
- [Flow xử lý ảnh](#flow-xử-lý-ảnh)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [API Documentation](#api-documentation)
- [Cách thêm Stage mới](#cách-thêm-stage-mới)
- [Giải thích Pipeline Pattern](#giải-thích-pipeline-pattern)

---

## 🏗️ Kiến trúc Pipeline

### Cấu trúc thư mục

```
src/
├── app.ts                          # Express app setup
├── server.ts                       # Entry point
├── config/
│   └── env.ts                      # Environment configuration
├── pipeline/
│   ├── core/
│   │   ├── Pipeline.ts             # Pipeline Engine (orchestrator)
│   │   ├── PipelineContext.ts       # Shared context object
│   │   └── Stage.ts                # Abstract base stage
│   ├── stages/
│   │   ├── InputStage.ts           # Validate & load image
│   │   ├── ResizeStage.ts          # Resize image
│   │   ├── FilterStage.ts          # Apply filters
│   │   ├── WatermarkStage.ts       # Add watermark
│   │   ├── CompressionStage.ts     # Compress output
│   │   └── OutputStage.ts          # Upload to S3
│   └── builders/
│       └── ImagePipelineBuilder.ts  # Builder Pattern for pipeline
├── modules/
│   └── image/
│       ├── image.controller.ts     # HTTP request handler
│       ├── image.route.ts          # Express routes + Multer
│       └── image.service.ts        # Business logic layer
├── utils/
│   ├── logger.ts                   # Custom colored logger
│   └── file.ts                     # File system utilities
└── types/
    └── image.types.ts              # TypeScript type definitions
```

### Kiến trúc tổng quan

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│ Input Stage │ ──▶ │  Resize  │ ──▶ │   Filter   │ ──▶ │  Watermark  │ ──▶ │ Compression   │ ──▶ │   Output    │
│             │     │  Stage   │     │   Stage    │     │   Stage     │     │    Stage      │     │   Stage     │
│ - Validate  │     │ - Width  │     │ - Grayscale│     │ - Text      │     │ - JPEG quality│     │ - UUID name │
│ - Load Sharp│     │ - Height │     │ - Sepia    │     │ - Image     │     │ - PNG level   │     │ - Upload S3 │
│ - Metadata  │     │ - Fit    │     │ - Blur     │     │ - Position  │     │ - WebP        │     │ - Update ctx│
└─────────────┘     └──────────┘     │ - Bright   │     └─────────────┘     └───────────────┘     └─────────────┘
                                     └────────────┘
                    ◀───────────── PipelineContext (shared state) ──────────────▶
```

### Design Patterns sử dụng

| Pattern | Áp dụng tại | Mục đích |
|---------|-------------|----------|
| **Pipeline Pattern** | `Pipeline.ts` | Orchestrate sequential stage execution |
| **Template Method** | `Stage.ts` | Wrap process() with logging, retry, error handling |
| **Builder Pattern** | `ImagePipelineBuilder.ts` | Fluent API for pipeline construction |
| **Strategy Pattern** | `FilterStage.ts` | Registry of filter functions |
| **Observer Pattern** | `Pipeline.ts` (EventEmitter) | Event-driven stage notifications |

---

## 🔄 Flow xử lý ảnh

```
Client Upload (multipart/form-data)
        │
        ▼
┌── Express Route (Multer) ──┐
│   - File validation        │
│   - Keep in memory         │
└────────────┬───────────────┘
             │
             ▼
┌── Image Controller ────────┐
│   - Parse options from body│
│   - Call ImageService      │
└────────────┬───────────────┘
             │
             ▼
┌── Image Service ───────────┐
│   - Build Pipeline (Builder)│
│   - Create PipelineContext  │
│   - Execute Pipeline        │
│   - Upload to S3            │
└────────────┬───────────────┘
             │
             ▼
┌── Pipeline Engine ─────────┐
│   FOR each stage:          │
│     1. Check enabled?      │
│     2. Log "started"       │
│     3. Execute process()   │
│     4. Retry on failure    │
│     5. Log result          │
│     6. Emit events         │
│   END                      │
│   Log metrics              │
└────────────┬───────────────┘
             │
             ▼
       Response JSON
```

---

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` (đã có sẵn mẫu):

```env
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif
DEFAULT_QUALITY=80
DEFAULT_WIDTH=800
DEFAULT_HEIGHT=600
WATERMARK_FONT_SIZE=24
WATERMARK_OPACITY=0.5
LOG_LEVEL=info

AWS_REGION=ap-southeast-1
S3_BUCKET=your-bucket-name
S3_KEY_PREFIX=images
S3_PUBLIC_BASE_URL=https://your-cdn-domain
S3_ACL=public-read
SQS_QUEUE_URL=
```

### 3. Chạy development

```bash
npm run dev
```

### 4. Build production

```bash
npm run build
npm start
```

---

## 📡 API Documentation

### POST /api/images/process

Upload và xử lý ảnh qua pipeline.

**Content-Type:** `multipart/form-data`

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | File ảnh (JPEG, PNG, WebP, GIF) |
| `width` | number | ❌ | Chiều rộng sau resize (default: 800) |
| `height` | number | ❌ | Chiều cao sau resize (default: 600) |
| `fit` | string | ❌ | Fit mode: `cover`, `contain`, `fill`, `inside`, `outside` |
| `filter` | string | ❌ | Filter: `grayscale`, `sepia`, `blur`, `brightness` |
| `filterValue` | number | ❌ | Giá trị filter (blur sigma, brightness factor) |
| `quality` | number | ❌ | Chất lượng output 1-100 (default: 80) |
| `format` | string | ❌ | Format output: `jpeg`, `png`, `webp` |
| `watermarkText` | string | ❌ | Nội dung watermark |
| `watermarkPosition` | string | ❌ | Vị trí: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` |
| `watermarkOpacity` | number | ❌ | Độ mờ watermark 0-1 |
| `watermarkFontSize` | number | ❌ | Kích thước font watermark |

#### Ví dụ Request

```bash
# Resize + Grayscale + Watermark
curl -X POST http://localhost:3000/api/images/process \
  -F "image=@photo.jpg" \
  -F "width=800" \
  -F "height=600" \
  -F "filter=grayscale" \
  -F "quality=85" \
  -F "watermarkText=© MyBrand" \
  -F "watermarkPosition=bottom-right"
```

```bash
# Chỉ resize + convert sang WebP
curl -X POST http://localhost:3000/api/images/process \
  -F "image=@photo.png" \
  -F "width=1200" \
  -F "format=webp" \
  -F "quality=90"
```

```bash
# Blur effect
curl -X POST http://localhost:3000/api/images/process \
  -F "image=@photo.jpg" \
  -F "filter=blur" \
  -F "filterValue=5"
```

#### Ví dụ Response (thành công)

```json
{
  "success": true,
  "data": {
    "outputUrl": "https://your-cdn-domain/images/6acc2f7b-a9f0-476d-9b98-7d6d5ceb2c37.jpg",
    "s3Key": "images/6acc2f7b-a9f0-476d-9b98-7d6d5ceb2c37.jpg",
    "filename": "6acc2f7b-a9f0-476d-9b98-7d6d5ceb2c37.jpg",
    "metadata": {
      "width": 200,
      "height": 150,
      "format": "jpeg",
      "size": 1260,
      "channels": 3,
      "hasAlpha": false,
      "originalName": "original-photo.jpg"
    },
    "logs": [
      {
        "stage": "InputStage",
        "status": "completed",
        "message": "Stage completed in 2ms",
        "duration": 2
      },
      {
        "stage": "ResizeStage",
        "status": "completed",
        "message": "Stage completed in 1ms",
        "duration": 1
      },
      {
        "stage": "FilterStage",
        "status": "completed",
        "message": "Stage completed in 0ms",
        "duration": 0
      },
      {
        "stage": "WatermarkStage",
        "status": "completed",
        "message": "Stage completed in 0ms",
        "duration": 0
      },
      {
        "stage": "CompressionStage",
        "status": "completed",
        "message": "Stage completed in 0ms",
        "duration": 0
      },
      {
        "stage": "OutputStage",
        "status": "completed",
        "message": "Stage completed in 118ms",
        "duration": 118
      }
    ],
    "processingTime": "123ms"
  }
}
```

#### Ví dụ Response (lỗi)

```json
{
  "success": false,
  "error": "Unsupported file type: application/pdf. Allowed: image/jpeg, image/png, image/webp, image/gif"
}
```

### GET /health

Health check endpoint.

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 42.017,
    "timestamp": "2026-05-07T03:46:29.567Z"
  }
}
```

---

## 🔧 Cách thêm Stage mới

### Bước 1: Tạo Stage class

```typescript
// src/pipeline/stages/ThumbnailStage.ts
import { Stage } from '../core/Stage';
import { PipelineContext } from '../core/PipelineContext';

export class ThumbnailStage extends Stage {
  constructor(enabled: boolean = true) {
    super('ThumbnailStage', enabled, 1); // name, enabled, retryCount
  }

  protected async process(context: PipelineContext): Promise<PipelineContext> {
    if (!context.sharpInstance) {
      throw new Error('No Sharp instance available');
    }

    // Your custom logic here
    context.sharpInstance = context.sharpInstance.resize(150, 150, {
      fit: 'cover',
    });

    return context;
  }
}
```

### Bước 2: Đăng ký vào Builder

```typescript
// Trong ImagePipelineBuilder.ts constructor
this.stageMap.set('ThumbnailStage', () => new ThumbnailStage());
```

### Bước 3: Sử dụng

```typescript
const pipeline = new ImagePipelineBuilder()
  .withInput()
  .withResize()
  .withFilter()
  // Thêm custom stage vào pipeline
  .build();

pipeline.addStage(new ThumbnailStage());
```

### Thêm Filter mới

```typescript
// Ở bất kỳ đâu trong code
FilterStage.registerFilter('sharpen', (context, value) => {
  context.sharpInstance = context.sharpInstance!.sharpen({
    sigma: value || 1,
  });
});
```

---

## 💡 Giải thích Pipeline Pattern

### Vì sao Pipeline Pattern phù hợp cho Image Processing?

| Đặc điểm | Giải thích |
|-----------|------------|
| **Sequential Processing** | Xử lý ảnh tự nhiên là tuần tự: load → resize → filter → save |
| **Single Responsibility** | Mỗi stage chỉ làm 1 việc, dễ test, dễ maintain |
| **Open/Closed Principle** | Thêm stage mới không sửa code cũ |
| **Dynamic Composition** | Bật/tắt stages runtime, thay đổi thứ tự linh hoạt |
| **Error Isolation** | Lỗi tại 1 stage không crash toàn bộ pipeline |
| **Retry Mechanism** | Mỗi stage có thể retry độc lập |
| **Observability** | Log chi tiết từng stage, metrics tổng |
| **Reusability** | Cùng stage dùng cho nhiều pipeline khác nhau |

### So sánh với các approach khác

```
❌ Monolithic Function:
   processImage(input) {
     validate(); resize(); filter(); watermark(); compress(); save();
   }
   → Khó test, khó mở rộng, 1 lỗi crash tất cả

✅ Pipeline Pattern:
   pipeline.addStage(input).addStage(resize).addStage(filter)...
   → Modular, testable, extensible, fault-tolerant
```

---

## ⚡ Bonus Features đã implement

- ✅ **Retry Mechanism**: Mỗi stage có thể retry khi fail
- ✅ **Event-driven Stages**: Pipeline extends EventEmitter, emit events cho mỗi stage
- ✅ **Metrics Logging**: Log thống kê stages executed/skipped/failed sau mỗi pipeline run
- ✅ **Config-based Pipeline**: Builder hỗ trợ `fromConfig()` để build pipeline từ JSON config
- ✅ **Builder Pattern**: Fluent API cho dynamic pipeline composition

---

## 📊 Công nghệ sử dụng

| Package | Phiên bản | Mục đích |
|---------|-----------|----------|
| Node.js | 18+ | Runtime |
| TypeScript | 6.x | Type safety |
| Express.js | 5.x | HTTP server |
| Sharp | 0.34.x | Image processing |
| Multer | 2.x | File upload |
| chalk | 4.x | Colored logging |
| dotenv | 17.x | Environment config |
| @aws-sdk/client-s3 | 3.x | Upload to S3 |
