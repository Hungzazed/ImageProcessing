---
marp: true
---

````markdown
---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: 'Segoe UI', sans-serif;
    padding: 40px;
  }

  h1 {
    color: #2563eb;
    font-size: 2.2rem;
  }

  h2 {
    color: #0f172a;
  }

  code {
    font-size: 0.9rem;
  }

  ul {
    font-size: 1.05rem;
  }

  section.lead {
    text-align: center;
    justify-content: center;
  }

  .small {
    font-size: 0.8rem;
  }
---

<!-- _class: lead -->

# HỆ THỐNG XỬ LÝ ẢNH SERVERLESS

# & ĐẨY THÔNG BÁO THỜI GIAN THỰC

## Kiến trúc Event-Driven kết hợp Micro Frontend (MFE)

### Technical Architecture Report

**Nhóm thực hiện:** [Tên nhóm]  
**Người trình bày:** [Tên bạn]

---

# ĐẶT VẤN ĐỀ

## Các hạn chế của kiến trúc Monolithic

### ❌ Resource Bottleneck

- Resize ảnh, filter, watermark tiêu tốn CPU/RAM lớn
- Làm nghẽn toàn bộ hệ thống backend

### ❌ Blocking HTTP Connection

- Client phải chờ xử lý hoàn tất
- Dễ phát sinh:
  - HTTP 504 Gateway Timeout
  - Request queue overload

### ❌ Không có Real-time Tracking

- Background jobs chạy ngầm
- Người dùng không biết:
  - Đang xử lý bước nào
  - Bao lâu hoàn tất

---

# GIẢI PHÁP KIẾN TRÚC

## 🎯 Mục tiêu hệ thống

### Asynchronous Processing

- Trả HTTP 200 ngay lập tức
- Toàn bộ xử lý chạy nền bằng Queue

### Real-time Streaming

- Stream trạng thái xử lý qua WebSocket
- UI cập nhật theo thời gian thực

### Decoupled & Scalable

- Backend và Frontend tách biệt hoàn toàn
- Scale độc lập từng thành phần

---

# SYSTEM ARCHITECTURE

## 3 tầng kiến trúc chính

### 1️⃣ Frontend Layer

- Next.js Host App
- Module Federation
- Dashboard UI
- AWS AppSync WebSocket

### 2️⃣ Processing Pipeline

- API Gateway
- Lambda Functions
- AWS SQS
- AWS S3

### 3️⃣ Notification Engine

- Notification Queue
- Notification Consumer
- AppSync
- SES
- Webhook Dispatcher

---

# HIGH LEVEL ARCHITECTURE

```text
Client UI
   │
   ▼
API Gateway
   │
   ▼
Lambda 00-start
   │
   ▼
ResizeQueue
   │
   ▼
01-resize
   │
   ▼
FilterQueue
   │
   ▼
02-filter
   │
   ▼
WatermarkQueue
   │
   ▼
03-watermark
   │
   ▼
CompressQueue
   │
   ▼
04-compress
   │
   ▼
NotificationQueue
   │
   ▼
05-notification-consumer
   ├── AppSync WebSocket
   ├── SES Email
   ├── Webhook
   └── DynamoDB
```
````

---

# END-TO-END FLOW

## Quy trình xử lý

### 1️⃣ Upload Image

Client upload ảnh lên S3

### 2️⃣ Trigger API

POST `/process`

### 3️⃣ Acknowledge

Lambda trả:

- jobId
- imageId
- HTTP 200

### 4️⃣ Queue Pipeline

Luồng xử lý chạy bất đồng bộ

### 5️⃣ Stream Updates

Push trạng thái về UI realtime

---

# EVENT-DRIVEN PIPELINE

## Pipe and Filter Pattern

### Loose Coupling

- Các Lambda không gọi trực tiếp nhau
- Chỉ giao tiếp qua Queue

### AWS SQS as Message Broker

- Điều tiết tải
- Chống overwhelm Lambda

### Auto Scaling

- Lambda scale theo số lượng message

### Pay-as-you-go

- Chỉ trả phí khi thực thi

---

# GIAI ĐOẠN XỬ LÝ 1

## 01-resize Lambda

### Chức năng

- Download ảnh từ S3
- Resize bằng Sharp (C++)
- Upload ảnh trung gian lên S3

---

## 02-filter Lambda

### Áp dụng filter:

- Grayscale
- Sepia
- Blur
- Brightness

---

# GIAI ĐOẠN XỬ LÝ 2

## 03-watermark Lambda

### Hỗ trợ:

- SVG Text Overlay
- Logo Watermark
- Opacity & Position

---

## 04-compress Lambda

### Tối ưu:

- Chuyển đổi WebP
- Nén dung lượng
- Export final image

---

# CƠ CHẾ KHÁNG LỖI

## Fault Isolation

- Lỗi ở 1 stage không làm crash toàn hệ thống

## SQS Retry

- Tự động retry khi lỗi tạm thời

## Dead Letter Queue (DLQ)

- Lưu message lỗi để debug

## High Reliability

- Không mất dữ liệu request

---

# PIPELINE PAYLOAD SCHEMA

## JSON Schema xuyên suốt pipeline

```json
{
  "jobId": "uuid",
  "imageId": "uuid",
  "userId": "user-01",
  "s3Bucket": "image-bucket",
  "s3Key": "processed/file.webp",
  "logs": []
}
```

---

## Trace Logs

Lưu:

- stage
- status
- duration
- timestamp
- message

---

# NOTIFICATION CONSUMER

## Event Aggregation

Tất cả Lambda Worker:

- publish success event
- publish failure event

→ gửi về NotificationQueue

---

## Stateless Consumer

Lambda:

### 05-notification-consumer

Thực hiện:

- phân tích eventType
- dispatch đa kênh

---

# MULTI-CHANNEL DISPATCHER

## Real-time Stream

- AppSync GraphQL Mutation
- WebSocket push

## Email Notification

- Amazon SES
- Gửi link download
- Compression report

## HTTP Webhook

- POST đến hệ thống bên thứ ba
- Retry với Exponential Backoff

## Audit Trail

- Lưu log vào DynamoDB

---

# REAL-TIME SYNCHRONIZATION

## No More Polling

### ❌ Polling

- tốn tài nguyên
- nhiều request dư thừa

### ✅ GraphQL Subscription

- kết nối WebSocket bền vững
- push realtime trực tiếp

---

## Flow

```text
Lambda Consumer
      │
      ▼
GraphQL Mutation
      │
      ▼
AWS AppSync
      │
      ▼
WebSocket Push
      │
      ▼
Client UI
```

---

# DYNAMODB SCHEMA

## subscriptions table

### Partition Key:

`userId`

Lưu:

- email
- webhook URL
- event preferences

---

## history table

### Keys:

- eventId
- timestamp

Lưu:

- payload
- response status
- audit logs

---

# MICRO FRONTEND (MFE)

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Module Federation

---

## Quantum Shell App

(Host - Port 3000)

Quản lý:

- Routing
- Authentication
- Dynamic Remote Loading

---

## Dashboard UI

(Remote - Port 3002)

Hiển thị:

- cấu hình pipeline
- live monitor
- image comparison

---

# LIÊN KẾT GIỮA CÁC MFE

## CustomEvent Bus

### Ưu điểm

- Navigation decoupling
- Không phụ thuộc router nội bộ

---

## Zustand Auth Store

### Đồng bộ:

- Cookie SSR
- LocalStorage

---

## Offline Simulator

### Hỗ trợ:

- giả lập SQS/Lambda local
- frontend dev không phụ thuộc cloud

---

# CLOUD SECURITY

## Least Privilege IAM

- Lambda chỉ có quyền cần thiết

## Anti Directory Traversal

```js
path.basename(filename);
```

Ngăn:

- ../
- đọc file hệ thống

---

## Encryption

- HTTPS/TLS
- AppSync API Key

---

# DEVOPS & IaC

## Infrastructure as Code

### Serverless Framework v3

Quản lý:

- Lambda
- SQS
- S3
- DynamoDB
- AppSync

---

## GitOps CI/CD

### GitHub Actions

- Automated Tests
- serverless deploy

---

## Sharp Binary Compatibility

```bash
npm install sharp --os=linux --cpu=x64
```

---

# KẾT LUẬN & ROADMAP

## Giá trị kỹ thuật

✅ Xử lý ảnh hiệu năng cao
✅ Kiến trúc Event-Driven scalable
✅ Real-time monitoring
✅ Frontend MFE độc lập

---

# ROADMAP

## Giai đoạn 1 — AI Automation

- AWS Rekognition
- Face Detection
- Background Removal

---

## Giai đoạn 2 — Global Optimization

- Amazon CloudFront CDN
- Multi-region delivery
- Low latency global access

---

<!-- _class: lead -->

# LIVE DEMO

## Quy trình trình diễn

1️⃣ Upload ảnh
2️⃣ Chọn filter
3️⃣ Trigger processing
4️⃣ Quan sát realtime progress
5️⃣ So sánh ảnh trước/sau

---

<!-- _class: lead -->

# THANK YOU

## Questions & Answers

```

```
