# Hệ thống Xử lý Ảnh Serverless & Dịch vụ Thông báo (A - Z)

Tài liệu này hướng dẫn cách thức hoạt động, luồng xử lý chi tiết từ đầu đến cuối (A - Z), cấu trúc tin nhắn và cách thiết lập/triển khai hai dịch vụ chính:

1. **`image-pipeline-app`**: Hệ thống xử lý ảnh dạng chuỗi (pipeline) bất đồng bộ, chia nhỏ các giai đoạn thành các AWS Lambda functions độc lập, giao tiếp với nhau thông qua AWS SQS và lưu trữ trên AWS S3.
2. **`notification-serverless`**: Dịch vụ thông báo serverless hoàn toàn, sử dụng AWS SQS để kích hoạt Lambda, AWS DynamoDB để lưu trữ cấu hình subscription và lịch sử gửi, AWS SES để gửi email, và đặc biệt sử dụng AWS AppSync (GraphQL Subscriptions) để đẩy tiến trình ảnh thời gian thực về client qua WebSocket.

---

## 1. Kiến trúc tổng quan & Luồng hoạt động (End-to-End Flow)

Hệ thống hoạt động theo cơ chế **Event-Driven (Kiến trúc hướng sự kiện)** sử dụng **AWS SQS** làm Message Broker trung tâm và **AWS S3** làm Storage.

```
+--------+       POST /process       +--------------------+
| Client | ────────────────────────> | startPipeline (API)|
+--------+                           +--------------------+
   │                                           │
   │ (Đăng ký/Sub AppSync)                     │ 1. Đẩy vào ResizeQueue
   ▼                                           ▼
+-------------------------+  Lắng nghe SQS  +-------------+       +-------------+
| notification-serverless | <────────────── | ResizeQueue | ────> |  01-resize  |
+-------------------------+                 +-------------+       +-------------+
   │ (Gửi Email/Webhook/AppSync)               │                      │
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

6. **Xử lý thông báo (`notification-serverless`)**:
   - Lambda `sqsConsumer` được kích hoạt khi hàng đợi SQS `NotificationQueue` nhận sự kiện từ các bước trên.
   - Thực hiện gọi API AWS AppSync (GraphQL Mutation `publishProgress`) để đẩy dữ liệu thời gian thực cho Client WebSocket đang subscribe.
   - Truy vấn thông tin cấu hình từ DynamoDB Subscriptions Table để lọc các kênh liên hệ đã đăng ký (email/webhook) của user.
   - Tự động thực thi gửi Email thông báo (qua AWS SES) hoặc đẩy HTTP Webhook (kèm cơ chế thử lại lũy thừa) và lưu log vào DynamoDB History Table.

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
    "watermark": {
      "type": "text",
      "text": "Bản quyền 2026",
      "position": "bottom-right",
      "opacity": 0.6
    },
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

- Đã cài đặt Node.js 20+ và CLI Serverless (`npm install -g serverless@3`).
- Đã cấu hình CLI AWS có quyền truy cập đầy đủ S3, SQS, DynamoDB, AppSync và SES (`aws configure`).

### Bước 2: Triển khai Ứng dụng Xử lý Ảnh (`image-pipeline-app`)

1. Cài đặt các thư viện phụ thuộc cho từng Lambda Function:
   ```bash
   cd image-pipeline-app
   cd functions/00-start && npm install
   cd ../01-resize && npm install --os=linux --cpu=x64 sharp
   cd ../02-filter && npm install --os=linux --cpu=x64 sharp
   cd ../03-watermark && npm install --os=linux --cpu=x64 sharp
   cd ../04-compress && npm install --os=linux --cpu=x64 sharp
   cd ../../
   ```
   > [!NOTE]
   > Cài đặt `sharp` bằng các cờ `--os=linux --cpu=x64` giúp mã nguồn chạy tốt khi đóng gói zip tải lên môi trường AWS Lambda Linux x64 mà không gặp lỗi lệch tệp tin nhị phân.

2. Triển khai tài nguyên lên AWS Cloud:
   ```bash
   cd image-pipeline-app
   serverless deploy --stage dev
   cd ../
   ```
   *Lưu ý URL API Gateway trả về ở dòng Output (Ví dụ: `POST https://xxxx.execute-api.us-east-1.amazonaws.com/dev/process`).*

### Bước 3: Triển khai Dịch vụ Thông báo (`notification-serverless`)

1. Cài đặt các plugin và thư viện phụ thuộc:
   ```bash
   cd notification-serverless
   serverless plugin install --name serverless-appsync-plugin
   
   cd functions/sqs-consumer
   npm install
   cd ../../
   ```

2. Triển khai dịch vụ lên AWS:
   ```bash
   cd notification-serverless
   serverless deploy --stage dev
   cd ../
   ```
   *Lưu ý ghi lại `GraphQLUrl` (AppSync Endpoint) và API Key trả về ở dòng Output.*

3. Xác thực Email trên AWS SES:
   Nếu tài khoản AWS đang ở chế độ SES Sandbox, bạn cần vào AWS Console -> SES -> Verified Identities để đăng ký và xác thực email gửi (`noreply@example.com` hoặc cấu hình tùy chỉnh ở `emailFrom` trong `serverless.yml`) và email nhận thông báo thử nghiệm.

---

## 4. Kiểm thử tích hợp từ A - Z (End-to-End Test)

### Bước 1: Đăng ký nhận thông báo trong CSDL DynamoDB
Vì hệ thống chạy Serverless và phi trạng thái, bạn đăng ký preferences thông báo bằng cách tạo một Subscription trực tiếp trong DynamoDB thông qua lệnh AWS CLI sau (thay thế địa chỉ email nhận bằng email của bạn đã xác thực ở AWS SES):
```bash
aws dynamodb put-item \
  --table-name notification-serverless-dev-subscriptions \
  --item '{
    "userId": {"S": "user-999"},
    "id": {"S": "sub-111"},
    "channel": {"S": "email"},
    "destination": {"S": "email_nhan_tin_nhan@example.com"},
    "events": {"L": [{"S": "image.completed"}, {"S": "image.failed"}]},
    "isActive": {"BOOL": true}
  }'
```

### Bước 2: Tải ảnh gốc lên S3
Tải một ảnh bất kỳ lên Bucket S3 được cấu hình bởi stack của bạn (ví dụ: tên bucket có dạng `image-pipeline-bucket-dev-<aws-account-id>`). Đặt tệp tại thư mục `inputs/nature.jpg`.

### Bước 3: Đăng ký lắng nghe tiến trình thời gian thực (GraphQL Subscription)
Sử dụng một client hỗ trợ GraphQL (như GraphQL Playground, Apollo Studio Sandbox hoặc Amplify) để đăng ký lắng nghe sự kiện thời gian thực bằng WebSocket sử dụng AppSync GraphQL URL và API Key nhận được ở Bước 3:
```graphql
subscription OnProgressUpdate {
  onProgressUpdate(userId: "user-999") {
    jobId
    imageId
    userId
    eventType
    status
    timestamp
    metadata
  }
}
```

### Bước 4: Kích hoạt Pipeline xử lý ảnh
Gửi yêu cầu xử lý ảnh thông qua API Gateway của `image-pipeline-app`:
```bash
curl -X POST https://xxxx.execute-api.us-east-1.amazonaws.com/dev/process \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-999",
    "s3Key": "inputs/nature.jpg",
    "options": {
      "resize": { "width": 800, "height": 600, "fit": "cover" },
      "filter": { "type": "sepia" },
      "watermark": { "type": "text", "text": "Bản Quyền 2026", "position": "bottom-right" },
      "compression": { "format": "webp", "quality": 80 }
    }
  }'
```

### Bước 5: Kiểm tra kết quả
- **Real-time GraphQL Subscription**: Client của bạn sẽ lập tức nhận được các bản cập nhật WebSocket cho sự kiện từ `image.processing.started`, `image.resized`, `image.filtered`, `image.watermarked` cho đến `image.completed`.
- **Email thông báo**: Kiểm tra hòm thư của bạn để xác nhận email thông báo tự động từ AWS SES sau khi quá trình nén hoàn thành.
- **Dữ liệu S3**: Tệp tin kết quả `final.webp` và các tệp tin trung gian sẽ hiển thị đầy đủ trên AWS S3 tại thư mục `processed/<jobId>/`.
- **DynamoDB Logs**: Lịch sử gửi thông báo chi tiết được lưu trữ đầy đủ trong bảng `notification-serverless-dev-history`.
