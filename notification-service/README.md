# Notification Service

Notification Service chịu trách nhiệm xử lý các events từ hệ thống Image Processing thông qua Kafka, và gửi thông báo qua Email hoặc Webhook đến các subscribers đã đăng ký.

## Yêu cầu hệ thống
- Node.js >= 18
- Docker & Docker Compose

## Cài đặt và Chạy local

1. Clone repository và vào thư mục dự án
2. Cài đặt dependencies:
   ```bash
   npm install
   ```
3. Tạo file `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
4. Khởi chạy Kafka, MongoDB và Notification Service thông qua Docker Compose:
   ```bash
   docker-compose up -d
   ```
   *Lưu ý: Service có thể được khởi chạy cục bộ không qua Docker bằng lệnh `npm run dev` nếu đã có sẵn MongoDB và Kafka.*

## Scripts
- `npm run dev`: Chạy ở chế độ development (watch mode)
- `npm run build`: Build TypeScript ra thư mục `dist/`
- `npm start`: Chạy production
- `npm test`: Chạy unit tests

## API Endpoints (Subscriptions)

### Tạo mới một Subscription
`POST /api/subscriptions`
```json
{
  "userId": "123",
  "channel": "webhook",
  "destination": "https://client-app.com/webhook",
  "events": ["processing.completed", "processing.failed"],
  "filters": {
    "jobId": "optional-job-id"
  }
}
```

### Lấy danh sách Subscriptions
`GET /api/subscriptions`
(Hỗ trợ query params: `?userId=123`)

### Xóa Subscription
`DELETE /api/subscriptions/:id`

## Sơ đồ kiến trúc
Vui lòng tham khảo file `docs/ARCHITECTURE.md` để xem kiến trúc và thiết kế chi tiết.
