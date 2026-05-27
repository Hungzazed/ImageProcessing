# Hệ thống Xử lý Ảnh Serverless & Dịch vụ Thông báo (A - Z)

Tài liệu này hướng dẫn cách thức hoạt động, luồng xử lý chi tiết từ đầu đến cuối (A - Z), cấu trúc tin nhắn và cách thiết lập/triển khai hai dịch vụ chính:
1. **`image-pipeline-app`**: Hệ thống xử lý ảnh dạng chuỗi (pipeline) bất đồng bộ, chia nhỏ các giai đoạn thành các AWS Lambda functions độc lập, giao tiếp với nhau thông qua AWS SQS và lưu trữ trên AWS S3.
2. **`notification-service`**: Dịch vụ lắng nghe trạng thái xử lý ảnh qua AWS SQS (long polling) để gửi thông báo (email, webhook) tới người dùng tương ứng với mỗi giai đoạn xử lý.

---

## 1. Kiến trúc tổng quan & Luồng hoạt động (End-to-End Flow)

Hệ thống hoạt động theo cơ chế **Event-Driven (Kiến trúc hướng sự kiện)** sử dụng **AWS SQS** làm Message Broker trung tâm và **AWS S3** làm Storage.

```
+--------+       POST /process       +--------------------+
| Client | ────────────────────────> | startPipeline (API)|
+--------+                           +--------------------+
   │                                           │
   │ (Đăng ký Webhook/Email)                   │ 1. Đẩy vào ResizeQueue
   ▼                                           ▼
+----------------------+  Lắng nghe SQS  +-------------+       +-------------+
| notification-service | <────────────── | ResizeQueue | ────> |  01-resize  |
+----------------------+                 +-------------+       +-------------+
   │ (Gửi Email/Webhook)                       │                      │
   │                                           │ 2. Đẩy FilterQueue   │ Tải/Ghi S3
   │                                           ▼                      ▼
   │                                     +-------------+       +-------------+
   │ <────────────────────────────────── | FilterQueue | ────> |  02-filter  |
   │             Gửi sự kiện             +-------------+       +-------------+
   │            (Notification)                 │                      │
   │                                           │ 3. Đẩy WatermarkQueue│ Tải/Ghi S3
   │                                           ▼                      ▼
   │                                     +-------------+       +-------------+
   │                                     |WatermarkQueue| ───> |03-watermark |
   │                                     +-------------+       +-------------+
   │                                           │                      │
   │                                           │ 4. Đẩy CompressQueue │ Tải/Ghi S3
   │                                           ▼                      ▼
   │                                     +-------------+       +-------------+
   │                                     |CompressQueue| ────> | 04-compress |
   │                                     +-------------+       +-------------+
   │                                                                  │
   │ <────────────────────────────────────────────────────────────────┘ (Thành công/Lỗi)
```

### Chi tiết luồng đi của ảnh (A - Z):

1. **Khởi động luồng (`00-start`)**:
   - Khách hàng tải ảnh lên AWS S3 và gọi HTTP POST `/process` đến API Gateway của `startPipeline` Lambda.
   - Lambda này sẽ kiểm tra tính hợp lệ của dữ liệu đầu vào (MIME Type, cấu trúc S3 Key).
   - Nó sinh ra `jobId` và `imageId` duy nhất (dạng UUID) để theo dõi toàn bộ vòng đời xử lý.
   - Gửi tin nhắn chứa ngữ cảnh xử lý ban đầu vào **`ResizeQueue`** và gửi sự kiện bắt đầu (`image.processing.started`) vào **`NotificationQueue`**.

2. **Giai đoạn thay đổi kích thước (`01-resize`)**:
   - Lambda `resize` được kích hoạt tự động bởi tin nhắn trong `ResizeQueue`.
   - Nó kiểm tra xem cấu hình yêu cầu có chứa tùy chọn `resize` (width, height) hay không.
     - **Nếu không có**: Ghi log "skipped", bỏ qua xử lý, đẩy nguyên trạng tin nhắn sang `FilterQueue`.
     - **Nếu có**: Tải ảnh gốc từ S3 về thư mục `/tmp`, dùng thư viện `sharp` để resize, đẩy ảnh sau resize lên thư mục `processed/{jobId}/resize.[ext]` trên S3, cập nhật metadata mới và đẩy tin nhắn sang `FilterQueue`.
   - Gửi sự kiện cập nhật (`image.resized` hoặc `image.failed` nếu lỗi) vào **`NotificationQueue`**.

3. **Giai đoạn áp dụng bộ lọc (`02-filter`)**:
   - Lambda `filter` được kích hoạt bởi tin nhắn trong `FilterQueue`.
   - Thực hiện tương tự: Tải ảnh từ bước trước đó trên S3, áp dụng bộ lọc ảnh (`grayscale`, `sepia`, `blur`, `brightness`) bằng `sharp`, đẩy ảnh sau xử lý lên S3 `processed/{jobId}/filter.[ext]`, đẩy tin nhắn sang `WatermarkQueue`.
   - Gửi sự kiện cập nhật (`image.filtered` hoặc `image.failed`) vào **`NotificationQueue`**.

4. **Giai đoạn chèn logo/chữ (`03-watermark`)**:
   - Lambda `watermark` được kích hoạt bởi tin nhắn trong `WatermarkQueue`.
   - Tải ảnh từ S3. Nếu là watermark dạng ảnh, nó tải thêm ảnh logo từ S3 về để composite. Nếu là dạng chữ, tự động render SVG chữ đè lên góc ảnh theo cấu hình vị trí (`bottom-right`, `center`,...).
   - Đẩy ảnh sau xử lý lên S3 `processed/{jobId}/watermarked.[ext]`, chuyển tiếp tin nhắn sang `CompressQueue`.
   - Gửi sự kiện cập nhật (`image.watermarked` hoặc `image.failed`) vào **`NotificationQueue`**.

5. **Giai đoạn định dạng & nén cuối cùng (`04-compress`)**:
   - Lambda `compress` được kích hoạt bởi tin nhắn trong `CompressQueue`.
   - Tải ảnh đã qua các bước xử lý trên S3.
   - Sử dụng `sharp` để đổi định dạng (JPEG, PNG, WebP) và tối ưu hóa dung lượng (nén chất lượng ảnh).
   - Ghi tệp hoàn chỉnh lên S3 `processed/{jobId}/final.[ext]`.
   - Gửi sự kiện kết thúc thành công (`image.completed` hoặc `image.failed`) kèm thông tin dung lượng, kích thước tệp cuối cùng vào **`NotificationQueue`**.

6. **Xử lý thông báo (`notification-service`)**:
   - Chạy một vòng lặp ngầm (long polling) lắng nghe hàng đợi SQS `NotificationQueue`.
   - Dịch vụ tự động phân giải (resolve) tên hàng đợi thành URL thực tế bằng AWS API.
   - Nhận diện các loại sự kiện (`image.processing.started`, `image.resized`, `image.filtered`, `image.watermarked`, `image.completed`, `image.failed`).
   - Lọc trong MongoDB xem có User hoặc Job nào đăng ký nhận sự kiện này (Webhook hoặc Email) và thực hiện gửi thông báo tương ứng.

---

## 2. Cấu trúc dữ liệu sự kiện (Event Schema)

### A. Payload truyền tải giữa các Stage (SQS Message)
Đây là cấu trúc thông tin chạy xuyên suốt pipeline qua các queue:
```json
{
  "jobId": "f9b8c7a6-1234-5678-abcd-ef0123456789",
  "imageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "userId": "user-999",
  "s3Bucket": "image-pipeline-bucket-dev-123456789",
  "s3Key": "processed/f9b8c7a6-1234-5678-abcd-ef0123456789/resize.png",
  "options": {
    "resize": { "width": 800, "height": 600, "fit": "cover" },
    "filter": { "type": "sepia" },
    "watermark": { "type": "text", "text": "Bản quyền 2026", "position": "bottom-right", "opacity": 0.6 },
    "compression": { "format": "webp", "quality": 85 }
  },
  "metadata": {
    "width": 800,
    "height": 600,
    "format": "png",
    "size": 142058
  },
  "logs": [
    {
      "stage": "InputStage",
      "status": "completed",
      "message": "Pipeline initialized",
      "timestamp": "2026-05-27T00:30:00Z"
    },
    {
      "stage": "ResizeStage",
      "status": "completed",
      "message": "Successfully resized image to 800x600",
      "timestamp": "2026-05-27T00:30:15Z",
      "duration": 250
    }
  ]
}
```

### B. Payload gửi đến Hàng đợi Thông báo (`NotificationQueue`)
Định dạng tương thích với thực thể `IEvent` trong `notification-service`:
```json
{
  "eventId": "e9c8b7a6-3210-4789-bcde-0123456789ab",
  "eventType": "image.resized",
  "timestamp": "2026-05-27T00:30:15.500Z",
  "source": "image-pipeline-app",
  "data": {
    "jobId": "f9b8c7a6-1234-5678-abcd-ef0123456789",
    "imageId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "userId": "user-999",
    "metadata": {
      "width": 800,
      "height": 600,
      "format": "png",
      "size": 142058
    }
  }
}
```

---

## 3. Quy trình Thiết lập & Triển khai nhanh

### Bước 1: Yêu cầu hệ thống
- Đã cài đặt Node.js 20+ và MongoDB chạy trên cổng mặc định `27017` (dùng cho dịch vụ thông báo).
- Đã cấu hình AWS CLI có quyền truy cập SQS và S3 (`aws configure`).

### Bước 2: Deploy ứng dụng xử lý ảnh (`image-pipeline-app`)
1. Cài đặt các thư viện cho từng function:
   ```bash
   cd image-pipeline-app
   # Chạy npm install trong từng thư mục con của functions/
   cd functions/00-start && npm install
   cd ../01-resize && npm install --os=linux --cpu=x64 sharp
   cd ../02-filter && npm install --os=linux --cpu=x64 sharp
   cd ../03-watermark && npm install --os=linux --cpu=x64 sharp
   cd ../04-compress && npm install --os=linux --cpu=x64 sharp
   cd ../../
   ```
   > [!NOTE]
   > Lệnh cài đặt `sharp` đính kèm `--os=linux --cpu=x64` giúp đảm bảo thư viện binary của Sharp tương thích tốt với môi trường AWS Lambda chạy trên Linux (tránh lỗi `ELF Header invalid`).

2. Deploy lên AWS bằng Serverless Framework:
   ```bash
   serverless deploy --stage dev
   ```
   *Lưu ý endpoint HTTP POST nhận về sau khi deploy thành công (ví dụ: `https://xxxx.execute-api.us-east-1.amazonaws.com/dev/process`).*

### Bước 3: Khởi chạy Dịch vụ thông báo (`notification-service`)
1. Chuyển vào thư mục dịch vụ và cài đặt thư viện:
   ```bash
   cd notification-service
   npm install
   ```
2. Tạo tệp cấu hình môi trường `.env` từ tệp ví dụ:
   ```bash
   cp .env.example .env
   ```
   Chỉ cần điền các tham số sau trong `.env`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/notification-db
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=access_key_cua_ban
   AWS_SECRET_ACCESS_KEY=secret_key_cua_ban
   ```
   *(Không cần khai báo URL hàng đợi, dịch vụ sẽ tự động truy vấn tên hàng đợi `image-pipeline-app-dev-notification-queue` để tìm ra URL tương ứng).*

3. Khởi chạy dịch vụ ở chế độ phát triển:
   ```bash
   npm run dev
   ```

---

## 4. Kiểm thử tích hợp từ A - Z (End-to-End Test)

1. **Đăng ký nhận thông báo**:
   Gửi HTTP POST đăng ký nhận webhook hoặc email khi xử lý thành công / thất bại tới `notification-service`:
   ```bash
   curl -X POST http://localhost:3000/api/subscriptions \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-999",
       "channel": "email",
       "destination": "user-email@example.com",
       "events": ["image.completed", "image.failed"],
       "isActive": true
     }'
   ```

2. **Tải ảnh lên S3**:
   Tải một bức ảnh (ví dụ: `nature.jpg`) lên Bucket S3 được tạo bởi Serverless Framework (có tên dạng: `image-pipeline-bucket-dev-<aws-account-id>`).

3. **Kích hoạt Pipeline**:
   Gửi yêu cầu xử lý ảnh tới API Gateway của Lambda `startPipeline`:
   ```bash
   curl -X POST https://xxxx.execute-api.us-east-1.amazonaws.com/dev/process \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-999",
       "s3Key": "inputs/nature.jpg",
       "options": {
         "resize": { "width": 800, "height": 600, "fit": "cover" },
         "filter": { "type": "sepia" },
         "watermark": { "type": "text", "text": "Copyright 2026", "position": "bottom-right" },
         "compression": { "format": "webp", "quality": 80 }
       }
     }'
   ```
   Nhận về phản hồi: `{"success":true,"message":"...","data":{"jobId":"uuid","imageId":"uuid"}}`.

4. **Kiểm tra kết quả**:
   - `notification-service` console log sẽ in thông báo nhận được tin nhắn từ SQS, xử lý sự kiện và dispatch email thông báo gửi đi.
   - S3 Bucket sẽ xuất hiện các tệp trung gian trong thư mục `processed/<jobId>/` và tệp kết quả cuối cùng `final.webp`.
