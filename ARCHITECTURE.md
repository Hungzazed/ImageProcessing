# Hệ thống Xử lý Ảnh & Thông báo Thời gian thực (Serverless Image Processing & Notification Architecture)

Tài liệu này mô tả chi tiết kiến trúc tổng thể, luồng truyền dữ liệu và mô hình giao tiếp giữa các thành phần trong hệ thống xử lý ảnh serverless và đẩy thông báo thời gian thực.

---

## 1. Sơ đồ Kiến trúc Tổng thể (System Architecture)

Dưới đây là mô hình hoạt động từ khi Client bắt đầu yêu cầu xử lý ảnh, qua các bước xử lý của đường ống (Pipeline), cho đến khi đẩy thông báo thời gian thực về giao diện qua AppSync WebSocket và gửi email/webhook.

```mermaid
graph TD
    %% Frontend / Client
    Client[Next.js Frontend] -->|1. Upload Raw Image| S3Bucket[Amazon S3 Bucket]
    Client -->|2. POST /process| APIGateway[API Gateway / EC2 Gateway]

    %% Pipeline Start
    APIGateway -->|Trigger| StartFn[00-start Lambda]
    StartFn -->|3a. Enqueue job| ResizeQueue[Resize SQS Queue]
    StartFn -.->|3b. Notify: started| NotifQueue[Notification SQS Queue]

    %% Image Pipeline Stages
    subgraph "Image Processing Pipeline (Decoupled SQS & Lambda)"
        ResizeQueue -->|Trigger| ResizeFn[01-resize Lambda]
        ResizeFn -->|Read/Write| S3Bucket
        ResizeFn -->|Enqueue| FilterQueue[Filter SQS Queue]
        ResizeFn -.->|Notify: resized / failed| NotifQueue

        FilterQueue -->|Trigger| FilterFn[02-filter Lambda]
        FilterFn -->|Read/Write| S3Bucket
        FilterFn -->|Enqueue| WatermarkQueue[Watermark SQS Queue]
        FilterFn -.->|Notify: filtered / failed| NotifQueue

        WatermarkQueue -->|Trigger| WatermarkFn[03-watermark Lambda]
        WatermarkFn -->|Read/Write| S3Bucket
        WatermarkFn -->|Enqueue| CompressQueue[Compress SQS Queue]
        WatermarkFn -.->|Notify: watermarked / failed| NotifQueue

        CompressQueue -->|Trigger| CompressFn[04-compress Lambda]
        CompressFn -->|Read/Write Final| S3Bucket
        CompressFn -.->|Notify: completed / failed| NotifQueue
    end

    %% Notification Engine
    subgraph "Notification Service (Event-Driven & Real-time)"
        NotifQueue -->|Trigger| NotifConsumer[05-notification-consumer Lambda]

        %% DynamoDB Config
        NotifConsumer -->|Read Subscriptions| DynamoDB[(Amazon DynamoDB)]
        NotifConsumer -->|Log History| DynamoDB

        %% Outbound channels
        NotifConsumer -->|Send Email| SES[Amazon SES]
        NotifConsumer -->|HTTP POST| Webhook[External Client Webhook]
        NotifConsumer -->|GraphQL Mutation| AppSync[AWS AppSync GraphQL API]
    end

    %% Real-time updates
    AppSync -.->|GraphQL Subscription over WebSockets| Client
    SES -.->|Delivery| EmailInbox[User Email Inbox]

    %% Styles
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef aws fill:#f97316,stroke:#c2410c,color:#fff;
    classDef database fill:#4b5563,stroke:#374151,color:#fff;
    classDef storage fill:#10b981,stroke:#047857,color:#fff;

    class Client client;
    class APIGateway,StartFn,ResizeFn,FilterFn,WatermarkFn,CompressFn,NotifConsumer,AppSync,SES aws;
    class S3Bucket storage;
    class DynamoDB database;
```

---

## 2. Biểu đồ Luồng Tuần tự (Sequence Diagram)

Quy trình tuần tự của các thông điệp trao đổi giữa các Service khi xử lý một tác vụ:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Frontend)
    participant S3 as Amazon S3
    participant Start as Lambda: 00-start
    participant SQS as SQS Pipeline Queues
    participant Workers as Lambda Pipeline Workers
    participant NotifQ as SQS NotificationQueue
    participant Consumer as Lambda: 05-notification-consumer
    participant Dynamo as DynamoDB Table
    participant AppSync as AWS AppSync
    participant SES as Amazon SES

    User->>S3: Upload ảnh gốc (Raw Image)
    S3-->>User: Trả về S3 Key (inputs/filename.jpg)
    User->>Start: Gọi HTTP POST /process (Kèm S3 Key & Options)

    activate Start
    Start->>SQS: Enqueue ResizeQueue (Payload với thông tin Job)
    Start->>NotifQ: Gửi sự kiện 'image.processing.started'
    Start-->>User: Trả về HTTP 200 (jobId & imageId ngay lập tức)
    deactivate Start

    Note over User: Frontend chuyển sang giao diện Live Monitor

    activate Consumer
    NotifQ->>Consumer: Kích hoạt SQS Trigger
    Consumer->>AppSync: Gọi GraphQL Mutation: publishProgress('started')
    AppSync-->>User: Đẩy trạng thái 'started' qua WebSocket (AppSync Live)
    deactivate Consumer

    %% Resize stage
    activate Workers
    SQS->>Workers: Lấy message từ ResizeQueue
    Workers->>S3: Tải ảnh gốc xuống
    Note over Workers: Xử lý Resize bằng thư viện Sharp
    Workers->>S3: Tải ảnh đã resize lên
    Workers->>SQS: Enqueue FilterQueue
    Workers->>NotifQ: Gửi sự kiện 'image.resized'
    deactivate Workers

    activate Consumer
    NotifQ->>Consumer: Lấy sự kiện 'image.resized'
    Consumer->>AppSync: Gọi GraphQL Mutation: publishProgress('resized')
    AppSync-->>User: Đẩy trạng thái 'resized' qua WebSocket
    deactivate Consumer

    Note over Workers: Các bước Filter và Watermark hoạt động tương tự...

    %% Compress stage
    activate Workers
    SQS->>Workers: Lấy message từ CompressQueue
    Workers->>S3: Tải ảnh từ bước trước
    Note over Workers: Nén ảnh & Chuyển định dạng (WebP/PNG/JPEG)
    Workers->>S3: Tải ảnh hoàn thiện (Final Image) lên S3
    Workers->>NotifQ: Gửi sự kiện 'image.completed' (Kèm metadata kích thước, s3Key)
    deactivate Workers

    activate Consumer
    NotifQ->>Consumer: Lấy sự kiện 'image.completed'
    Consumer->>Dynamo: Truy vấn cấu hình Subscription của User
    Dynamo-->>Consumer: Trả về danh sách đăng ký (Email / Webhook)

    par Gửi Email
        Consumer->>SES: Gửi email thông báo hoàn thành
        SES-->>User: Nhận Email
    and Đẩy Real-time lên UI
        Consumer->>AppSync: Gọi GraphQL Mutation: publishProgress('completed', metadata)
        AppSync-->>User: Đẩy trạng thái 'completed' (Kèm s3Key ảnh kết quả) qua WebSocket
    end

    Consumer->>Dynamo: Ghi lịch sử gửi thông báo (History Table)
    deactivate Consumer

    Note over User: Giao diện chuyển sang Compare Step và hiển thị ảnh kết quả từ S3
```

---

## 3. Định dạng dữ liệu trao đổi (Data Schema)

### 3.1. Payload gửi giữa các bước xử lý ảnh (SQS Pipeline Message)

Đây là cấu trúc thông điệp được truyền nối tiếp qua các hàng đợi `ResizeQueue` $\rightarrow$ `FilterQueue` $\rightarrow$ `WatermarkQueue` $\rightarrow$ `CompressQueue`:

```json
{
  "jobId": "f784e1b8-27b0-4467-bc85-a7c1b52a9261",
  "imageId": "6c49e29a-2411-4091-893f-c967406b3a0e",
  "userId": "user-999",
  "s3Bucket": "image-pipeline-bucket-prod-108836621838",
  "s3Key": "processed/f784e1b8-27b0-4467-bc85-a7c1b52a9261/resize.jpg",
  "options": {
    "resize": { "width": 800, "height": 600, "fit": "cover" },
    "filter": { "type": "sepia", "value": 1.3 },
    "watermark": {
      "type": "text",
      "text": "Copyright 2026",
      "position": "bottom-right",
      "opacity": 0.6
    },
    "compression": { "format": "webp", "quality": 85 }
  },
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 1048576
  },
  "logs": [
    {
      "stage": "InputStage",
      "status": "completed",
      "message": "Pipeline initialized",
      "timestamp": "2026-05-28T14:40:00.000Z"
    },
    {
      "stage": "ResizeStage",
      "status": "completed",
      "message": "Successfully resized image to 800x600",
      "timestamp": "2026-05-28T14:40:02.000Z",
      "duration": 450
    }
  ]
}
```

### 3.2. Payload gửi tới hàng đợi thông báo (SQS Notification Event)

Các hàm xử lý gửi thông điệp trạng thái này vào `NotificationQueue` sau mỗi bước xử lý:

```json
{
  "eventId": "90ba95ef-cc6c-48c6-b3de-cc86c26bbefb",
  "eventType": "image.completed",
  "timestamp": "2026-05-28T14:40:08.500Z",
  "source": "image-pipeline-app",
  "data": {
    "jobId": "f784e1b8-27b0-4467-bc85-a7c1b52a9261",
    "imageId": "6c49e29a-2411-4091-893f-c967406b3a0e",
    "userId": "user-999",
    "metadata": {
      "s3Key": "processed/f784e1b8-27b0-4467-bc85-a7c1b52a9261/final.webp",
      "width": 800,
      "height": 600,
      "format": "webp",
      "size": 108200
    }
  }
}
```

---

## 4. Các điểm kết nối chính và Giao thức (Key Integration Points)

1. **API Gateway (HTTP POST):** Cung cấp API không đồng bộ công khai để tiếp nhận file yêu cầu xử lý từ Client. Trả về `jobId` ngay lập tức để Client không cần chờ xử lý đồng bộ dài dòng.
2. **AWS SQS Queues:** Đóng vai trò là bộ đệm (message broker) tin cậy giữa các khâu xử lý ảnh, giúp hệ thống có khả năng tự động điều chỉnh tải (Auto-scaling), chống mất mát tác vụ và xử lý cô lập lỗi khi có sự cố tại một Lambda.
3. **DynamoDB Tables:**
   - `subscriptions`: Chứa cấu hình đăng ký thông báo qua Email/Webhook của người dùng.
   - `history`: Nhật ký lưu trữ kết quả và trạng thái gửi thông báo (phục vụ giám sát lỗi và cơ chế thử lại - retry).
4. **AWS AppSync (GraphQL over WebSockets):** Hỗ trợ đẩy thông báo đẩy tiến trình xử lý trực tiếp xuống Frontend. Sử dụng cấu hình xác thực qua `API_KEY` của AppSync để đảm bảo bảo mật kết nối WebSocket.
5. **Amazon SES (SMTP/SES Client):** Hệ thống chuyển tiếp email bảo mật để gửi báo cáo trạng thái hoàn thành kèm các số liệu về tỷ lệ nén ảnh cho người dùng.
