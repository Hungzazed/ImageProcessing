Hãy thiết kế và xây dựng một Notification Service cho hệ thống Image Processing với các yêu cầu sau:

## Bối cảnh hệ thống
Đây là một microservice độc lập trong kiến trúc image processing pipeline. Service này chịu trách nhiệm nhận các event từ message broker, xử lý và gửi notification đến các subscriber đã đăng ký.

## Yêu cầu kỹ thuật

### Ngôn ngữ & Framework
Sử dụng Node.js với TypeScript.

### Message Broker
Tích hợp với Apache Kafka để consume các event từ image processing pipeline.

### Các loại notification cần hỗ trợ
  1. Webhook (HTTP POST đến URL của client)
  2. Email (SMTP / SendGrid)

### Events cần xử lý
  1. image.uploaded — ảnh vừa được upload thành công
  2. processing.started — bắt đầu xử lý ảnh
  3. processing.completed — xử lý hoàn tất, kèm URL kết quả
  4. processing.failed — xử lý thất bại, kèm mã lỗi và thông điệp

### Schema event chuẩn
Mỗi event phải có cấu trúc:
{
  "eventId": "uuid-v4",
  "eventType": "processing.completed",
  "timestamp": "ISO-8601",
  "source": "image-processor",
  "data": {
    "jobId": "string",
    "imageId": "string",
    "userId": "string",
    "metadata": {}
  }
}

## Tính năng nghiệp vụ

### Quản lý Subscription
- CRUD API để subscriber đăng ký/hủy nhận notification
- Mỗi subscription chỉ định: loại channel (webhook/email/...), địa chỉ nhận, danh sách event muốn nhận, filter theo userId/jobId

### Xử lý & Gửi notification
  1. Retry tự động với chiến lược exponential backoff (tối đa 3 lần)
  2. Dead Letter Queue để lưu các notification thất bại sau khi hết retry

### Persistence
- Lưu trữ lịch sử notification đã gửi (trạng thái, timestamp, số lần retry)
- Sử dụng PostgreSQL hoặc MongoDB (tùy chọn)

## Cấu trúc project
Tổ chức code theo Domain-Driven Design hoặc Clean Architecture với các layer rõ ràng:
- Controller / Handler (API)
- Use Case / Service (business logic)
- Repository / Adapter (data & external services)
- Domain / Entity (models)

## Yêu cầu bổ sung
  1. Dockerfile và docker-compose.yml đầy đủ
  2. Unit tests với coverage tối thiểu 80%

## Deliverables
Hãy cung cấp:
1. Toàn bộ source code có thể chạy được
2. README.md với hướng dẫn cài đặt và chạy local
3. Ví dụ cấu hình môi trường (.env.example)
4. Sơ đồ kiến trúc tổng quan (dạng text/ASCII hoặc mermaid)
5. Giải thích các quyết định thiết kế quan trọng

Hãy bắt đầu bằng cách trình bày kiến trúc tổng thể trước, sau đó triển khai từng thành phần.