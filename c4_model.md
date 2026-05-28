# Sơ đồ C4 Model - Hệ thống Xử lý Ảnh & Thông báo Serverless

Tài liệu này mô tả kiến trúc hệ thống xử lý ảnh và thông báo thời gian thực thông qua 3 cấp độ (Level) của mô hình C4 Model sử dụng Mermaid.js.

---

## 1. Level 1: Sơ đồ ngữ cảnh hệ thống (System Context Diagram)

Sơ đồ này biểu diễn ranh giới của hệ thống, các tác nhân bên ngoài (Người dùng) và các hệ thống liên kết ngoại vi.

```mermaid
graph TB
    %% Nodes
    User["Người dùng (Client)<br>[Person]<br>Sử dụng ứng dụng để tải ảnh lên, cấu hình xử lý và theo dõi tiến trình trực quan."]
    
    System["Hệ thống Xử lý Ảnh & Thông báo<br>[Software System]<br>Xử lý ảnh bất đồng bộ qua các bước, lưu trữ dữ liệu, đẩy thông báo live và gửi email/webhook."]
    
    SES["Amazon SES<br>[External System]<br>Hệ thống gửi email đám mây của AWS, chuyển tiếp email thông báo hoàn thành đến người dùng."]
    
    Webhook["External Webhook API<br>[External System]<br>Hệ thống bên thứ ba nhận thông tin sự kiện xử lý ảnh thông qua HTTP POST."]

    %% Relationships
    User -->|"1. Tải ảnh & Gửi yêu cầu xử lý<br>2. Nhận cập nhật tiến trình (WebSocket)"| System
    System -->|"Gửi email thông báo hoàn tất"| SES
    SES -->|"Chuyển tiếp email"| User
    System -->|"Đẩy thông tin sự kiện (HTTP POST)"| Webhook

    %% Styling
    style User fill:#0d6efd,stroke:#0a58ca,color:#fff
    style System fill:#198754,stroke:#146c43,color:#fff
    style SES fill:#6c757d,stroke:#495057,color:#fff
    style Webhook fill:#6c757d,stroke:#495057,color:#fff
```

---

## 2. Level 2: Sơ đồ Container (Container Diagram)

Sơ đồ này phân rã Hệ thống Xử lý Ảnh & Thông báo thành các container công nghệ (ứng dụng chạy độc lập, database, storage) và sự tương tác giữa chúng.

```mermaid
graph TB
    %% Actors & External Systems
    User["Người dùng (Client)<br>[Person]"]
    SES["Amazon SES<br>[External System]"]
    Webhook["External Webhook API<br>[External System]"]

    subgraph FrontEnd ["Hệ thống Giao diện (Micro Frontend Architecture)"]
        Shell["Quantum Shell App<br>[Next.js Host Container]<br>Đóng vai trò điều phối routing, quản lý phiên đăng nhập (Zustand) và chứa MFE Remotes."]
        
        DashboardUI["Dashboard UI MFE<br>[Next.js Remote Container]<br>Giao diện tương tác điều khiển pipeline, theo dõi tiến trình qua WebSocket."]
        
        AuthUI["Auth App MFE<br>[Next.js Remote Container]<br>Giao diện đăng nhập và phân quyền truy cập."]
    end

    subgraph CloudStorage ["Lưu trữ Dữ liệu"]
        S3["Amazon S3 Bucket<br>[Storage Container]<br>Lưu trữ ảnh gốc (inputs) và các ảnh trung gian/hoàn thiện (processed)."]
        
        DynamoDB["Amazon DynamoDB<br>[NoSQL Database Container]<br>Lưu trữ cấu hình subscription và nhật ký lịch sử gửi thông báo."]
    end

    subgraph BackendServices ["Hệ thống Dịch vụ Backend (AWS Cloud)"]
        APIGateway["AWS API Gateway<br>[API Gateway Container]<br>Cung cấp các Restful endpoint công khai để kích hoạt pipeline."]
        
        AppSync["AWS AppSync GraphQL API<br>[GraphQL/WebSocket Container]<br>Quản lý kết nối WebSockets thời gian thực qua GraphQL Subscriptions."]
        
        PipelineContainer["Image Pipeline Services<br>[AWS Lambda & SQS Container]<br>Đường ống xử lý ảnh bất đồng bộ tách rời (Decoupled Stage)."]
        
        NotifService["Notification Consumer<br>[AWS Lambda Container]<br>Xử lý sự kiện từ hàng đợi thông báo, gửi email, gọi webhook và AppSync."]
    end

    %% Client Interactions
    User -->|"Truy cập trình duyệt"| Shell
    Shell -->|"Tải động Module Federation"| DashboardUI
    Shell -->|"Tải động Module Federation"| AuthUI
    
    %% Storage & API Calls
    DashboardUI -->|"1. Upload ảnh trực tiếp"| S3
    DashboardUI -->|"2. POST /process"| APIGateway
    DashboardUI -.->|"Lắng nghe tiến trình (WebSockets)"| AppSync

    %% Backend flows
    APIGateway -->|"Trigger"| PipelineContainer
    PipelineContainer -->|"Đọc/Ghi dữ liệu ảnh"| S3
    
    PipelineContainer -.->|"Gửi sự kiện trạng thái (SQS)"| NotifService
    
    NotifService -->|"Truy vấn cấu hình & ghi lịch sử"| DynamoDB
    NotifService -->|"Publish progress update (Mutation)"| AppSync
    NotifService -->|"Gửi email hoàn thành"| SES
    NotifService -->|"Gọi HTTP POST"| Webhook
    
    SES -.->|"Gửi email"| User

    %% Styling
    style User fill:#0d6efd,stroke:#0a58ca,color:#fff
    style SES fill:#6c757d,stroke:#495057,color:#fff
    style Webhook fill:#6c757d,stroke:#495057,color:#fff
    
    style Shell fill:#17a2b8,stroke:#117a8b,color:#fff
    style DashboardUI fill:#17a2b8,stroke:#117a8b,color:#fff
    style AuthUI fill:#17a2b8,stroke:#117a8b,color:#fff
    
    style S3 fill:#fd7e14,stroke:#d96109,color:#fff
    style DynamoDB fill:#fd7e14,stroke:#d96109,color:#fff
    style APIGateway fill:#e83e8c,stroke:#b11d5c,color:#fff
    style AppSync fill:#e83e8c,stroke:#b11d5c,color:#fff
    style PipelineContainer fill:#28a745,stroke:#1e7e34,color:#fff
    style NotifService fill:#28a745,stroke:#1e7e34,color:#fff
```

---

## 3. Level 3: Sơ sơ đồ Thành phần (Component Diagram)

Ở cấp độ này, chúng ta đi sâu vào cấu trúc bên trong của hai container backend quan trọng: **Image Pipeline Services** và **Notification Consumer**.

### 3.1. Thành phần của Image Pipeline Services

Sơ đồ thể hiện cách các hàng đợi AWS SQS (Message Broker) kết nối các AWS Lambda độc lập xử lý hình ảnh.

```mermaid
graph LR
    %% API Gateway trigger
    API["AWS API Gateway"]
    S3["Amazon S3 Bucket"]

    subgraph PipelineComp ["Image Pipeline Components"]
        StartFn["00-start Lambda<br>[NodeJS Component]<br>Nhận tham số, validate, cấp Job ID, ghi logs."]
        
        ResizeQ["Resize SQS Queue<br>[AWS SQS Queue]"]
        ResizeFn["01-resize Lambda<br>[NodeJS Component]<br>Tải ảnh từ S3, chạy Sharp resize, ghi lên S3."]
        
        FilterQ["Filter SQS Queue<br>[AWS SQS Queue]"]
        FilterFn["02-filter Lambda<br>[NodeJS Component]<br>Tải ảnh, áp dụng filter (sepia, blur...), ghi lên S3."]
        
        WatermarkQ["Watermark SQS Queue<br>[AWS SQS Queue]"]
        WatermarkFn["03-watermark Lambda<br>[NodeJS Component]<br>Chèn text SVG hoặc logo ảnh, ghi lên S3."]
        
        CompressQ["Compress SQS Queue<br>[AWS SQS Queue]"]
        CompressFn["04-compress Lambda<br>[NodeJS Component]<br>Tối ưu hóa dung lượng (WebP/PNG/JPEG), ghi tệp final."]
    end

    NotifQ["Notification SQS Queue<br>[AWS SQS Queue]"]

    %% Flow
    API -->|HTTP POST| StartFn
    StartFn -->|"Đẩy tin nhắn khởi tạo"| ResizeQ
    StartFn -.->|"Đẩy sự kiện started"| NotifQ

    ResizeQ -->|Kích hoạt| ResizeFn
    ResizeFn -->|Đọc/Ghi ảnh| S3
    ResizeFn -->|"Đẩy tin nhắn tiếp theo"| FilterQ
    ResizeFn -.->|"Đẩy sự kiện resized / failed"| NotifQ

    FilterQ -->|Kích hoạt| FilterFn
    FilterFn -->|Đọc/Ghi ảnh| S3
    FilterFn -->|"Đẩy tin nhắn tiếp theo"| WatermarkQ
    FilterFn -.->|"Đẩy sự kiện filtered / failed"| NotifQ

    WatermarkQ -->|Kích hoạt| WatermarkFn
    WatermarkFn -->|Đọc/Ghi ảnh| S3
    WatermarkFn -->|"Đẩy tin nhắn tiếp theo"| CompressQ
    WatermarkFn -.->|"Đẩy sự kiện watermarked / failed"| NotifQ

    CompressQ -->|Kích hoạt| CompressFn
    CompressFn -->|Đọc/Ghi ảnh Final| S3
    CompressFn -.->|"Đẩy sự kiện completed / failed"| NotifQ

    %% Styles
    style API fill:#e83e8c,stroke:#b11d5c,color:#fff
    style S3 fill:#fd7e14,stroke:#d96109,color:#fff
    style NotifQ fill:#20c997,stroke:#17a2b8,color:#fff

    style StartFn fill:#6f42c1,stroke:#5930ac,color:#fff
    style ResizeFn fill:#6f42c1,stroke:#5930ac,color:#fff
    style FilterFn fill:#6f42c1,stroke:#5930ac,color:#fff
    style WatermarkFn fill:#6f42c1,stroke:#5930ac,color:#fff
    style CompressFn fill:#6f42c1,stroke:#5930ac,color:#fff

    style ResizeQ fill:#20c997,stroke:#17a2b8,color:#fff
    style FilterQ fill:#20c997,stroke:#17a2b8,color:#fff
    style WatermarkQ fill:#20c997,stroke:#17a2b8,color:#fff
    style CompressQ fill:#20c997,stroke:#17a2b8,color:#fff
```

### 3.2. Thành phần của Notification Consumer

Sơ đồ thể hiện luồng xử lý và điều phối các tác vụ thông báo trong khối **Notification Consumer**.

```mermaid
graph TB
    NotifQ["Notification SQS Queue<br>[AWS SQS Queue]"]

    subgraph ConsumerComp ["Notification Consumer Components"]
        Consumer["05-notification-consumer Lambda<br>[NodeJS Handler]<br>Lắng nghe và đọc các tin nhắn sự kiện từ Notification SQS Queue."]
        
        SubService["Subscription Manager<br>[NodeJS Module]<br>Đọc tùy chọn thông báo của user (Email, Webhook) từ DynamoDB."]
        
        AppSyncClient["AppSync Publisher<br>[NodeJS Module]<br>Gọi GraphQL API publishProgress để đẩy WebSocket live updates."]
        
        EmailClient["SES Mailer<br>[NodeJS Module]<br>Tạo template email, chèn thông số nén ảnh và gửi qua AWS SES."]
        
        WebhookClient["Webhook Client (Axios)<br>[NodeJS Module]<br>Thực thi HTTP POST đến endpoint ngoại vi cấu hình sẵn."]
        
        HistoryLogger["History Logger<br>[NodeJS Module]<br>Lưu logs kết quả thực thi và retry vào DynamoDB."]
    end

    %% External Connections
    SubDB[("DynamoDB: subscriptions<br>[AWS DynamoDB]")]
    HistoryDB[("DynamoDB: history<br>[AWS DynamoDB]")]
    AppSyncAPI["AWS AppSync API<br>[AWS AppSync]"]
    SES["Amazon SES<br>[AWS SES]"]
    Webhook["External Webhook API"]

    %% Flow
    NotifQ -->|Trigger| Consumer
    
    Consumer -->|1. Yêu cầu danh sách sub| SubService
    SubService -->|Truy vấn| SubDB
    
    Consumer -->|2. Gọi gửi tin nhắn song song| AppSyncClient
    Consumer -->|2. Gọi gửi tin nhắn song song| EmailClient
    Consumer -->|2. Gọi gửi tin nhắn song song| WebhookClient
    
    AppSyncClient -->|GraphQL Mutation| AppSyncAPI
    EmailClient -->|Send Email API| SES
    WebhookClient -->|HTTP POST| Webhook
    
    Consumer -->|3. Yêu cầu ghi log| HistoryLogger
    HistoryLogger -->|PutItem| HistoryDB

    %% Styles
    style NotifQ fill:#20c997,stroke:#17a2b8,color:#fff
    style SubDB fill:#fd7e14,stroke:#d96109,color:#fff
    style HistoryDB fill:#fd7e14,stroke:#d96109,color:#fff
    style AppSyncAPI fill:#e83e8c,stroke:#b11d5c,color:#fff
    style SES fill:#6c757d,stroke:#495057,color:#fff
    style Webhook fill:#6c757d,stroke:#495057,color:#fff

    style Consumer fill:#6f42c1,stroke:#5930ac,color:#fff
    style SubService fill:#007bff,stroke:#0056b3,color:#fff
    style AppSyncClient fill:#007bff,stroke:#0056b3,color:#fff
    style EmailClient fill:#007bff,stroke:#0056b3,color:#fff
    style WebhookClient fill:#007bff,stroke:#0056b3,color:#fff
    style HistoryLogger fill:#007bff,stroke:#0056b3,color:#fff
```
