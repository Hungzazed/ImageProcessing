# Sơ đồ C4 Model - Hệ thống Xử lý Ảnh & Thông báo Serverless

Tài liệu này mô tả kiến trúc hệ thống xử lý ảnh và thông báo thời gian thực thông qua 3 cấp độ (Level) của mô hình C4 Model sử dụng cú pháp chuẩn của **Mermaid C4 Diagram** (C4Context, C4Container, C4Component), được đối chiếu chính xác với mã nguồn thực tế của dự án.

---

## 1. Level 1: Sơ đồ ngữ cảnh hệ thống (System Context Diagram)

Sơ đồ này biểu diễn ranh giới của toàn bộ hệ thống, các tác nhân bên ngoài (Người dùng) và các hệ thống liên kết ngoại vi sử dụng `C4Context`.

```mermaid
C4Context
    title Sơ đồ Ngữ cảnh Hệ thống Xử lý Ảnh & Thông báo (Level 1)
    
    Person(user, "Người dùng (Client)", "Đăng nhập, tải ảnh lên, cấu hình xử lý và theo dõi tiến trình trực quan.")
    
    System(system, "Hệ thống Xử lý Ảnh & Thông báo", "Quản lý người dùng, xử lý ảnh bất đồng bộ qua các bước (Resize, Filter, Watermark, Compress), đẩy trạng thái live qua WebSockets và gửi email/webhook thông báo.")
    
    System_Ext(ses, "Amazon SES", "Hệ thống gửi email đám mây của AWS, chuyển tiếp email thông báo hoàn thành đến người dùng.")
    
    System_Ext(webhook, "External Webhook API", "Hệ thống bên thứ ba nhận thông tin sự kiện xử lý ảnh thông qua HTTP POST.")

    Rel(user, system, "Đăng nhập, tải ảnh, gửi cấu hình xử lý và nhận cập nhật tiến trình", "HTTPS / WebSockets")
    Rel(system, ses, "Gửi thông báo email qua", "AWS SES SDK")
    Rel(ses, user, "Chuyển tiếp email thông báo", "SMTP")
    Rel(system, webhook, "Đẩy thông tin sự kiện xử lý", "HTTP POST")
```

---

## 2. Level 2: Sơ đồ Container (Container Diagram)

Sơ đồ này phân rã hệ thống thành các Container chạy độc lập dựa trên cấu trúc thư mục thực tế của dự án:
- **Frontend MFE**: `shell-app` (cổng 3000), `auth-frontend-next` (`auth-app` cổng 3001), `dashboard-ui` (cổng 3002), và `user-ui` (cổng 3003).
- **Backend Services**: `auth-service` (Express API cổng 3000) và các Serverless AWS Services (`image-pipeline-app` & `notification-serverless`).
- **Storage**: Amazon S3, Amazon DynamoDB, và MongoDB.

```mermaid
C4Container
    title Sơ đồ Container - Hệ thống Xử lý Ảnh & Thông báo (Level 2)
    
    Person(user, "Người dùng (Client)", "Tương tác qua trình duyệt Web")
    System_Ext(ses, "Amazon SES", "Hệ thống gửi email đám mây của AWS")
    System_Ext(webhook, "External Webhook API", "Hệ thống nhận webhook của bên thứ ba")

    System_Boundary(frontend_boundary, "Hệ thống Giao diện (Micro Frontend - MFE)") {
        Container(shell, "Quantum Shell App", "Next.js 15 (Host)", "Điều phối routing, bảo vệ tuyến đường (Edge Middleware), quản lý session (Zustand) và chứa MFE Remotes.")
        Container(dashboard_ui, "Dashboard UI MFE", "Next.js 15 (Remote)", "Giao diện cấu hình pipeline, hiển thị log xử lý ảnh và theo dõi tiến trình WebSocket.")
        Container(auth_ui, "Auth App MFE", "Next.js 16 (Remote)", "Giao diện đăng nhập, đăng ký sử dụng Token-based Auth.")
        Container(user_ui, "Users UI MFE", "Next.js (Remote)", "Giao diện danh sách tài khoản người dùng.")
    }

    System_Boundary(backend_boundary, "Dịch vụ Backend (Serverless & Express APIs)") {
        Container(auth_service, "Auth Service API", "NodeJS / Express", "Quản lý tài khoản, mã hóa mật khẩu, kiểm tra quyền hạn (RBAC) và cấp phát Refresh/Access token.")
        Container(api_gateway, "AWS API Gateway", "API Gateway", "Cung cấp Restful endpoint khởi tạo job xử lý ảnh.")
        Container(appsync, "AWS AppSync GraphQL API", "GraphQL/WebSockets", "Quản lý kết nối WebSockets thời gian thực qua GraphQL Subscriptions.")
        Container(pipeline, "Image Pipeline Services", "AWS Lambda & SQS", "Đường ống xử lý ảnh bất đồng bộ tách rời (decoupled) qua các hàng đợi công việc.")
        Container(notif_consumer, "Notification Consumer", "AWS Lambda", "Tiêu thụ tin nhắn từ NotificationQueue, phân phối thông báo đa kênh.")
    }

    System_Boundary(storage_boundary, "Lưu trữ Dữ liệu") {
        Container(s3, "Amazon S3 Bucket", "Amazon S3", "Lưu trữ ảnh gốc (inputs) và ảnh sau xử lý (processed).")
        ContainerDb(dynamodb, "Amazon DynamoDB", "NoSQL Database", "Lưu trữ cấu hình subscription và nhật ký lịch sử thông báo.")
        ContainerDb(mongodb, "MongoDB Database", "NoSQL Database", "Lưu trữ dữ liệu tài khoản, phân quyền và thông tin định danh của auth-service.")
    }

    %% Client Interactions
    Rel(user, shell, "Truy cập ứng dụng", "HTTPS")
    Rel(shell, auth_ui, "Nhúng qua Iframe & đồng bộ trạng thái", "HTTPS / postMessage")
    Rel(shell, dashboard_ui, "Nhúng qua Iframe & đồng bộ trạng thái", "HTTPS / postMessage")
    Rel(shell, user_ui, "Nhúng qua Iframe & đồng bộ trạng thái", "HTTPS / postMessage")
    
    %% Auth Flows
    Rel(auth_ui, auth_service, "Yêu cầu đăng ký / đăng nhập", "HTTP POST /auth")
    Rel(user_ui, auth_service, "Truy vấn danh sách người dùng", "HTTP GET /users")
    Rel(auth_service, mongodb, "Đọc/Ghi thông tin user", "Mongoose API")

    %% Dashboard / Pipeline Flows
    Rel(dashboard_ui, s3, "Tải ảnh gốc trực tiếp", "HTTPS")
    Rel(dashboard_ui, api_gateway, "Kích hoạt xử lý ảnh /process", "HTTP POST")
    Rel(dashboard_ui, appsync, "Lắng nghe cập nhật tiến trình", "GraphQL WebSocket")

    Rel(api_gateway, pipeline, "Kích hoạt xử lý", "AWS SDK/Lambda Trigger")
    Rel(pipeline, s3, "Đọc/Ghi ảnh trung gian & final", "S3 API")
    Rel(pipeline, notif_consumer, "Gửi tin nhắn sự kiện", "AWS SQS")

    %% Notification Flows
    Rel(notif_consumer, dynamodb, "Tra cứu subscription & ghi history", "DynamoDB API")
    Rel(notif_consumer, appsync, "Đẩy sự kiện trạng thái (publishProgress)", "GraphQL Mutation")
    Rel(notif_consumer, ses, "Gửi email hoàn thành", "SES API")
    Rel(notif_consumer, webhook, "Gửi callback", "HTTP POST")
    
    Rel(ses, user, "Gửi email báo cáo", "SMTP")
```

---

## 3. Level 3: Sơ đồ Thành phần (Component Diagram)

Dưới đây là sơ đồ thành phần chi tiết của các container backend cốt lõi: **Image Pipeline Services**, **Notification Consumer**, và **Auth Service API**.

### 3.1. Thành phần của Image Pipeline Services

Sơ đồ thể hiện luồng xử lý và cách thức các Lambda function liên kết tuần tự qua hàng đợi SQS.

```mermaid
C4Component
    title Sơ đồ Thành phần - Image Pipeline Services (Level 3)
    
    Container(api_gateway, "AWS API Gateway", "API Gateway", "Cung cấp Restful endpoint.")
    Container(s3, "Amazon S3 Bucket", "Amazon S3", "Lưu trữ hình ảnh.")
    Container_Ext(notif_queue, "Notification SQS Queue", "AWS SQS", "Hàng đợi nhận tin nhắn thông báo.")

    Container_Boundary(pipeline_boundary, "Image Pipeline Services") {
        Component(start_fn, "00-start Lambda", "NodeJS Lambda", "Tiếp nhận tham số, validate đầu vào, cấp Job ID, đẩy vào queue.")
        Component(resize_queue, "Resize SQS Queue", "AWS SQS", "Hàng đợi tin nhắn cho công đoạn resize.")
        Component(resize_fn, "01-resize Lambda", "NodeJS Lambda", "Tải ảnh từ S3, thay đổi kích thước bằng Sharp, tải lên S3.")
        Component(filter_queue, "Filter SQS Queue", "AWS SQS", "Hàng đợi tin nhắn cho công đoạn áp dụng bộ lọc.")
        Component(filter_fn, "02-filter Lambda", "NodeJS Lambda", "Tải ảnh, áp dụng bộ lọc ảnh (sepia, blur...) bằng Sharp, tải lên S3.")
        Component(watermark_queue, "Watermark SQS Queue", "AWS SQS", "Hàng đợi tin nhắn cho công đoạn watermark.")
        Component(watermark_fn, "03-watermark Lambda", "NodeJS Lambda", "Tải ảnh, chèn logo ảnh hoặc text SVG bằng Sharp, tải lên S3.")
        Component(compress_queue, "Compress SQS Queue", "AWS SQS", "Hàng đợi tin nhắn cho công đoạn nén cuối.")
        Component(compress_fn, "04-compress Lambda", "NodeJS Lambda", "Tải ảnh, nén dung lượng, đổi định dạng tối ưu bằng Sharp, ghi tệp final.")
    }

    Rel(api_gateway, start_fn, "Kích hoạt", "HTTPS")
    Rel(start_fn, resize_queue, "Đẩy tin nhắn công việc", "SQS SDK")
    Rel(start_fn, notif_queue, "Gửi sự kiện started", "SQS SDK")

    Rel(resize_queue, resize_fn, "Kích hoạt chạy", "SQS Trigger")
    Rel(resize_fn, s3, "Đọc / Ghi ảnh resize", "S3 API")
    Rel(resize_fn, filter_queue, "Đẩy tin nhắn tiếp theo", "SQS SDK")
    Rel(resize_fn, notif_queue, "Gửi sự kiện resized / failed", "SQS SDK")

    Rel(filter_queue, filter_fn, "Kích hoạt chạy", "SQS Trigger")
    Rel(filter_fn, s3, "Đọc / Ghi ảnh filter", "S3 API")
    Rel(filter_fn, watermark_queue, "Đẩy tin nhắn tiếp theo", "SQS SDK")
    Rel(filter_fn, notif_queue, "Gửi sự kiện filtered / failed", "SQS SDK")

    Rel(watermark_queue, watermark_fn, "Kích hoạt chạy", "SQS Trigger")
    Rel(watermark_fn, s3, "Đọc / Ghi ảnh watermark", "S3 API")
    Rel(watermark_fn, compress_queue, "Đẩy tin nhắn tiếp theo", "SQS SDK")
    Rel(watermark_fn, notif_queue, "Gửi sự kiện watermarked / failed", "SQS SDK")

    Rel(compress_queue, compress_fn, "Kích hoạt chạy", "SQS Trigger")
    Rel(compress_fn, s3, "Đọc / Ghi ảnh final", "S3 API")
    Rel(compress_fn, notif_queue, "Gửi sự kiện completed / failed", "SQS SDK")
```

### 3.2. Thành phần của Notification Consumer

Sơ đồ mô tả luồng logic bên trong của Consumer Lambda dùng để định tuyến thông báo đến các kênh.

```mermaid
C4Component
    title Sơ đồ Thành phần - Notification Consumer Service (Level 3)
    
    Container_Ext(notif_queue, "Notification SQS Queue", "AWS SQS", "Hàng đợi nhận sự kiện từ các Lambda xử lý ảnh.")
    ContainerDb(sub_db, "DynamoDB Subscriptions Table", "AWS DynamoDB", "Lưu cấu hình đăng ký thông báo.")
    ContainerDb(history_db, "DynamoDB History Table", "AWS DynamoDB", "Lưu lịch sử thông báo.")
    Container(appsync_api, "AWS AppSync GraphQL API", "AWS AppSync", "Cơ sở hạ tầng quản lý WebSockets.")
    System_Ext(ses, "Amazon SES", "Simple Email Service", "Hệ thống gửi email.")
    System_Ext(webhook, "External Webhook API", "External API", "Máy chủ webhook nhận thông báo.")

    Container_Boundary(consumer_boundary, "Notification Consumer Container") {
        Component(sqs_handler, "SQS Consumer Handler", "NodeJS Function", "Tiếp nhận tin nhắn, parse payload và điều phối các task thông báo.")
        Component(sub_manager, "Subscription Manager", "NodeJS Module", "Truy vấn danh sách đăng ký của user dựa trên userId.")
        Component(appsync_pub, "AppSync Publisher", "NodeJS Module", "Gửi GraphQL mutation publishProgress cập nhật trạng thái thời gian thực.")
        Component(ses_mailer, "SES Mailer", "NodeJS Module", "Biên soạn email báo cáo kết quả và gửi thông qua AWS SES.")
        Component(webhook_client, "Webhook Client (Axios)", "NodeJS Module", "Gửi HTTP POST payload đến client webhook ngoại vi.")
        Component(history_logger, "History Logger", "NodeJS Module", "Ghi log kết quả phân phối thông báo vào DynamoDB.")
    }

    Rel(notif_queue, sqs_handler, "Kích hoạt chạy", "SQS Trigger")
    
    Rel(sqs_handler, sub_manager, "Yêu cầu danh sách subscriptions")
    Rel(sub_manager, sub_db, "Truy vấn DynamoDB", "Query")

    Rel(sqs_handler, appsync_pub, "Gọi push status")
    Rel(appsync_pub, appsync_api, "Gửi GraphQL Mutation", "HTTP POST")

    Rel(sqs_handler, ses_mailer, "Gọi send email")
    Rel(ses_mailer, ses, "Gửi Mail", "AWS SES SDK")

    Rel(sqs_handler, webhook_client, "Gọi post webhook")
    Rel(webhook_client, webhook, "Đẩy dữ liệu sự kiện", "HTTP POST")

    Rel(sqs_handler, history_logger, "Yêu cầu ghi nhật ký")
    Rel(history_logger, history_db, "Ghi logs", "PutItem")
```

### 3.3. Thành phần của Auth Service API

Sơ đồ mô tả cấu trúc MVC bên trong của dịch vụ Express quản lý xác thực và thông tin người dùng.

```mermaid
C4Component
    title Sơ đồ Thành phần - Auth Service API (Level 3)
    
    Container(auth_ui, "Auth App MFE", "Next.js Remote", "Giao diện đăng nhập, đăng ký.")
    Container(user_ui, "Users UI MFE", "Next.js Remote", "Giao diện hiển thị danh sách người dùng.")
    ContainerDb(mongodb, "MongoDB Database", "NoSQL Database", "Lưu trữ thông tin user.")

    Container_Boundary(auth_service_boundary, "Auth Service (Express API)") {
        Component(app_entry, "Express App Entry (index.js)", "Express Instance", "Khởi tạo Express Server, thiết lập Passport, CORS và Router.")
        
        Component(auth_router, "Auth Routes", "Express Router", "Định tuyến các API đăng nhập (/login), đăng ký (/register) và logout (/logout).")
        Component(user_router, "User Routes", "Express Router", "Định tuyến các API quản lý thông tin profile (/users).")
        
        Component(passport_mid, "Passport Middleware", "Passport JS", "Xử lý session và cấu hình xác thực (Local/JWT Strategy).")
        Component(auth_ctrl, "Auth Controller", "Javascript Module", "Xử lý nghiệp vụ đăng ký tài khoản, sinh hash mật khẩu, kiểm tra quyền hạn.")
        Component(user_ctrl, "User Controller", "Javascript Module", "Xử lý nghiệp vụ truy vấn danh sách, cập nhật profile.")
        
        Component(db_helper, "Database Helper (db.js)", "Mongoose Connection", "Khởi tạo kết nối đến MongoDB và xử lý lỗi kết nối.")
        Component(user_model, "User Model", "Mongoose Schema", "Định nghĩa cấu trúc schema và các method kiểm tra mật khẩu.")
    }

    %% Relationships
    Rel(auth_ui, app_entry, "Gửi request xác thực", "HTTP/JSON")
    Rel(user_ui, app_entry, "Gửi request quản lý user", "HTTP/JSON")
    
    Rel(app_entry, auth_router, "Định tuyến /auth")
    Rel(app_entry, user_router, "Định tuyến /users")
    
    Rel(auth_router, passport_mid, "Sử dụng")
    Rel(auth_router, auth_ctrl, "Gọi controllers")
    
    Rel(user_router, passport_mid, "Sử dụng")
    Rel(user_router, user_ctrl, "Gọi controllers")
    
    Rel(auth_ctrl, user_model, "Đăng ký / Truy vấn user")
    Rel(user_ctrl, user_model, "Truy vấn / Cập nhật user")
    
    Rel(app_entry, db_helper, "Gọi kết nối khi start")
    Rel(db_helper, mongodb, "Kết nối & duy trì Session pool", "Mongoose Connection")
    Rel(user_model, mongodb, "Thực thi truy vấn dữ liệu", "MongoDB Protocol")
```
