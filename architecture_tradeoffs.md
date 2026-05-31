# Đánh giá Kiến trúc Hệ thống: Ưu điểm, Nhược điểm & Sự Đánh đổi (Architecture Trade-offs)

Tài liệu này phân tích chi tiết về mặt kiến trúc phần mềm của dự án **Hệ thống Xử lý Ảnh Serverless & Đẩy thông báo thời gian thực trên nền tảng Micro Frontend**. Phân tích tập trung vào ba khối cốt lõi: **Image Pipeline (Xử lý ảnh bất đồng bộ)**, **Notification Engine (Động cơ thông báo)**, và **Micro Frontend Client (Kiến trúc giao diện)**.

---

## 1. Đường ống Xử lý Ảnh Bất đồng bộ (Serverless Image Pipeline)
*Kiến trúc: API Gateway -> Lambda (Start) -> SQS (Resize/Filter/Watermark/Compress Queues) -> Lambda Workers -> Amazon S3.*

### ▲ Ưu điểm (Pros)
* **Khả năng co giãn tự động vượt trội (Scalability):** Hệ thống tận dụng tối đa cơ chế tự động mở rộng của AWS SQS và AWS Lambda. Khi lượng ảnh tải lên tăng đột biến (ví dụ: giờ cao điểm), SQS đóng vai trò làm bộ đệm giảm tải, tránh tình trạng sập hệ thống (buffer effect).
* **Cô lập lỗi (Fault Isolation / Resiliency):** Mỗi công đoạn (Resize, Filter, Watermark, Compress) hoạt động trong một Lambda độc lập kết nối qua các hàng đợi riêng biệt. Nếu bước watermark bị lỗi (ví dụ: file watermark bị hỏng), tiến trình sẽ dừng lại tại đó và có thể được chạy lại (retry) từ hàng đợi SQS mà không cần xử lý lại từ đầu các bước tốn tài nguyên trước đó như resize hay filter.
* **Tối ưu hóa chi phí (Cost Efficiency):** Áp dụng mô hình Pay-as-you-go. Khi không có yêu cầu xử lý ảnh, chi phí vận hành CPU gần như bằng 0 (chỉ mất chi phí lưu trữ S3 rất nhỏ). Không cần thuê và duy trì các máy chủ EC2 nhàn rỗi.
* **Hiệu năng cao với Sharp:** Sử dụng thư viện Sharp (được viết bằng C++) giúp tối ưu hóa việc giải nén và xử lý điểm ảnh trực tiếp trên RAM thay vì ghi đĩa liên tục, mang lại tốc độ xử lý nhanh hơn từ 4 - 5 lần so với ImageMagick hay Jimp.

### ▼ Nhược điểm (Cons)
* **Trễ khởi động lạnh (Cold Start Latency):** AWS Lambda sử dụng môi trường thực thi ảo. Nếu một hàm không chạy trong một khoảng thời gian, yêu cầu tiếp theo sẽ gặp tình trạng "khởi động lạnh" (có thể mất từ 1 - 3 giây để khởi tạo container), gây ảnh hưởng nhỏ đến thời gian xử lý ảnh đầu tiên.
* **Độ phức tạp trong vận hành & giám sát (Operational Complexity):** Việc chia nhỏ một tiến trình tuần tự thành 5 queue SQS và 5 hàm Lambda khác nhau khiến việc giám sát luồng dữ liệu trở nên phức tạp. Việc kiểm tra log khi xảy ra lỗi yêu cầu phải trace qua nhiều nhóm log CloudWatch khác nhau dựa trên `jobId`.
* **Chi phí lưu trữ và đọc/ghi trung gian:** Mỗi giai đoạn xử lý đều tải ảnh từ S3 xuống thư mục `/tmp` của Lambda, xử lý rồi lại đẩy ngược lên thư mục `processed/{jobId}/` trên S3 để chuyển tiếp cho bước sau. Điều này làm tăng số lượng API call (PUT/GET) lên S3 và tăng dung lượng lưu trữ tạm thời nếu không có chính sách tự động xóa (S3 Lifecycle Policy).

### ⚖ Sự đánh đổi (Trade-offs)
* **Đổi tính đơn giản (Simplicity) lấy khả năng chịu lỗi (Resiliency):** Việc viết một ứng dụng Express duy nhất chạy tuần tự các hàm xử lý ảnh trên một server sẽ dễ viết, dễ test cục bộ và có độ trễ kết nối cực thấp. Tuy nhiên, kiến trúc này chấp nhận sự phức tạp trong phát triển (decoupling) để đổi lấy một hệ thống không bao giờ nghẽn mạng và có khả năng scale không giới hạn.

---

## 2. Hệ thống Thông báo Serverless (Notification Engine)
*Kiến trúc: Notification SQS Queue -> Lambda Consumer -> AWS AppSync (GraphQL WebSocket), AWS SES, Webhook.*

### ▲ Ưu điểm (Pros)
* **Xử lý bất đồng bộ hoàn toàn (Asymmetric Coupling):** Việc gửi email (qua SES) hay gọi webhook của bên thứ ba thường có độ trễ lớn và độ tin cậy không ổn định. Bằng việc tách riêng luồng gửi thông báo thông qua SQS và Lambda Consumer, sự cố từ các nhà cung cấp dịch vụ gửi mail hay server webhook của đối tác sẽ không làm ảnh hưởng hay trì hoãn tiến trình xử lý hình ảnh cốt lõi.
* **Trải nghiệm Live-UI mượt mà:** Sự kết hợp giữa AWS AppSync GraphQL Subscriptions và WebSockets giúp giao diện client liên tục cập nhật trạng thái mà không cần thực hiện cơ chế kéo thông tin liên tục (polling) tốn băng thông và tài nguyên.
* **Linh hoạt đa kênh:** Dễ dàng bổ sung các kênh thông báo mới (như SMS, Telegram Bot, Slack Notification) bằng cách viết thêm module gửi trong file [index.js](file:///home/hungzazed/workspace/KienTruc/ImageProcessing/image-pipeline-app/functions/05-notification-consumer/index.js) mà không cần can thiệp vào mã nguồn xử lý ảnh.

### ▼ Nhược điểm (Cons)
* **Phụ thuộc sâu vào nhà cung cấp (Vendor Lock-in):** Thiết kế sử dụng rất nhiều dịch vụ độc quyền của AWS như AppSync, DynamoDB, SES, SQS. Nếu sau này doanh nghiệp muốn chuyển hệ thống sang Google Cloud (GCP) hoặc Microsoft Azure, đội ngũ phát triển sẽ phải thiết kế và viết lại gần như toàn bộ hạ tầng thông báo và cơ sở dữ liệu.
* **Chi phí kết nối WebSocket của AppSync:** AWS AppSync tính phí dựa trên số lượng phút kết nối WebSocket và số lượng tin nhắn được đẩy đi. Nếu hệ thống có hàng vạn client kết nối đồng thời và giữ kết nối liên tục 24/7, chi phí này có thể vượt qua chi phí thuê một cụm máy chủ WebSocket chuyên dụng (như Socket.io chạy trên ECS).

### ⚖ Sự đánh đổi (Trade-offs)
* **Đổi chi phí quản trị (No-Ops) lấy chi phí dịch vụ (Pay-per-use):** Hệ thống chọn AppSync và DynamoDB để loại bỏ hoàn toàn công việc quản trị hạ tầng (không cần cấu hình clustering, replication, load balancer cho Socket.io hay MongoDB). Đổi lại, chi phí hóa đơn AWS sẽ tăng tuyến tính theo lượng sử dụng và phụ thuộc chặt chẽ vào chính sách giá của AWS.

---

## 3. Kiến trúc Giao diện Micro Frontend (MFE)
*Kiến trúc: Next.js 15 (Host Shell) -> Module Federation -> Remote MFEs (Auth UI, Dashboard UI, Users UI).*

### ▲ Ưu điểm (Pros)
* **Phát triển và triển khai độc lập (Independent Deployability):** Các đội phát triển có thể làm việc độc lập trên từng folder dự án (`auth-frontend-next`, `dashboard-ui`, `shell-app`). Một thay đổi nhỏ ở trang danh sách người dùng (`user-ui`) hay trang đăng nhập (`auth-app`) có thể được build và deploy trực tiếp mà không cần build và deploy lại ứng dụng tổng `shell-app`.
* **Giảm tải kích thước Bundle (Bundle Size Optimization):** Nhờ cơ chế Module Federation, client chỉ tải các đoạn code (chunks) của module cần thiết tại thời điểm sử dụng thay vì tải toàn bộ mã nguồn của một ứng dụng Monolith lớn ngay lần đầu truy cập.
* **Khả năng mô phỏng và chạy Offline ấn tượng:** Cơ chế Mock Remotes/Simulators được xây dựng bên trong `shell-app` cho phép giả lập các trạng thái xử lý ảnh của AWS SQS/Lambda hoàn toàn ở client khi môi trường đám mây ngoại tuyến. Điều này giúp nâng cao đáng kể năng suất của lập trình viên Frontend mà không phụ thuộc vào kết nối AWS API.

### ▼ Nhược điểm (Cons)
* **Cấu hình phức tạp và dễ vỡ (Fragile Webpack Integration):** Việc tích hợp Module Federation vào Next.js (đặc biệt là App Router) đòi hỏi phải cấu hình sâu thông qua gói `@module-federation/nextjs-mf`. Chỉ một sự không đồng nhất nhỏ trong phiên bản React/Next.js giữa các Remote và Host cũng có thể dẫn đến lỗi Hydration Mismatch hoặc lỗi ChunkLoadError tại runtime.
* **Rủi ro rò rỉ và xung đột CSS (Style Leakage):** Mặc dù Tailwind CSS được sử dụng phổ biến, nhưng nếu các remote app định nghĩa các class CSS tùy biến trùng tên mà không có namespace hay tiền tố (prefix) rõ ràng, giao diện sẽ dễ bị xung đột hiển thị khi tải động chung trên trình duyệt.

### ⚖ Sự đánh đổi (Trade-offs)
* **Đổi độ đơn giản trong phát triển lấy khả năng mở rộng quy mô nhân sự (Team Scalability):** Đối với các dự án nhỏ dưới 5 người, việc làm kiến trúc Micro Frontend mang lại nhiều phiền toái hơn là lợi ích do tốn thời gian cấu hình hạ tầng MFE. Tuy nhiên, dự án chấp nhận sự phức tạp ban đầu này để chuẩn bị sẵn sàng cho mô hình phát triển doanh nghiệp lớn (Enterprise), nơi có nhiều nhóm độc lập cùng tham gia đóng góp code vào một giao diện chung.

---

## Tóm tắt Mô hình Quyết định (Decision Matrix)

| Tiêu chí | Lựa chọn Hiện tại (Serverless + MFE) | Lựa chọn Thay thế (Monolith Express + Single SPA) | Rationale (Lý do chọn) |
| :--- | :--- | :--- | :--- |
| **Khả năng Scale** | **Rất cao (Vô hạn)** | Trung bình (Cần Auto Scaling Group) | Ảnh là tài liệu nặng, lượng tải không đều nên Serverless tối ưu hơn. |
| **Độ trễ xử lý** | Trung bình (Tốn thời gian qua SQS) | **Thấp (Xử lý trực tiếp trên RAM)** | Chấp nhận độ trễ vài trăm mili-giây qua Queue để đổi lấy tính an toàn dữ liệu. |
| **Độ phức tạp Dev** | Cao (Cần IaC Serverless, MFE Webpack) | **Thấp (Standard NodeJS & React)** | Chuẩn bị sẵn sàng cho ứng dụng doanh nghiệp lớn, phân tách chức năng rõ ràng. |
| **Quản trị hệ thống** | **Cực thấp (No-Ops)** | Cao (Cần quản lý DB, WebSockets, VM) | Giảm thiểu nhân sự quản trị hệ thống bằng cách giao hoàn toàn cho AWS quản lý. |

---

## 4. Phân tích & Ước lượng Chi phí vận hành (AWS Cost Estimation)

Một trong những ưu điểm mạnh nhất của mô hình Serverless trong dự án này là **cấu trúc chi phí tối ưu** (Pay-as-you-go). Dưới đây là phân tích chi tiết về các thành tố chi phí và ước lượng ngân sách vận hành thực tế.

### 4.1. Các yếu tố thúc đẩy chi phí (Cost Drivers) trên AWS

* **AWS Lambda (Xử lý chính):** Chi phí tính theo số lượng request ($0.20 per 1M requests) và thời gian thực thi nhân với bộ nhớ allocated (GB-seconds). Vì Sharp biên dịch native C++, thời gian chạy của Lambda rất nhanh (thường < 500ms cho mỗi bước), giúp giữ chi phí này ở mức cực thấp.
* **Amazon S3 (Lưu trữ & API):** 
  * Dung lượng lưu trữ: $0.023/GB/tháng.
  * API call (PUT, GET): $0.005 per 1,000 PUT requests, $0.0004 per 1,000 GET requests. Luồng pipeline ghi đè/lưu tạm nhiều tệp trung gian sẽ tạo ra nhiều API PUT/GET call.
* **AWS AppSync (WebSocket Live Updates):**
  * Kết nối: $0.08 per 1M phút kết nối.
  * Tin nhắn: $2.00 per 1M tin nhắn push (GraphQL Mutation/Subscription).
* **AWS SQS (Hàng đợi tin nhắn):** $0.40 per 1M requests (AWS Free Tier miễn phí 1 triệu request đầu tiên mỗi tháng).
* **Amazon DynamoDB (CSDL cấu hình & log):** Tính theo dung lượng lưu trữ ($0.25/GB/tháng) và đơn vị đọc/ghi (WCU/RCU).
* **Amazon SES (Gửi mail):** Miễn phí 62,000 email/tháng nếu gửi từ Lambda. Sau đó phí là $0.10 cho mỗi 1,000 email gửi đi.

### 4.2. Giả lập Chi phí thực tế (Cost Simulation)

Giả sử ứng dụng xử lý **100,000 ảnh/tháng** (dung lượng ảnh gốc trung bình 2MB/ảnh). Mỗi ảnh trải qua đầy đủ 5 bước xử lý Lambda (Start, Resize, Filter, Watermark, Compress) và gửi 1 email kết quả:

| Dịch vụ AWS | Khối lượng ước tính (cho 100,000 ảnh) | Đơn giá AWS | Chi phí hàng tháng |
| :--- | :--- | :--- | :--- |
| **AWS Lambda** | 500,000 lượt chạy (trung bình 500ms, cấp phát 1024MB RAM) = 250,000 GB-seconds. | $0.0000166667 / GB-sec (Nằm gọn trong Free Tier 400,000 GB-sec) | **$0.00** |
| **AWS SQS** | 600,000 requests (đẩy & nhận thông điệp qua các queue) | $0.40 / 1M requests (Nằm gọn trong Free Tier 1M requests) | **$0.00** |
| **Amazon S3** | - Lưu trữ: 250 GB/tháng (Ảnh gốc + final)<br>- API Calls: 500k PUTs và 500k GETs | - Lưu trữ: $0.023/GB<br>- API: $0.005/1k PUT, $0.0004/1k GET | - Lưu trữ: $5.75<br>- API calls: $2.70<br>**Tổng S3: $8.45** |
| **AWS AppSync** | - 500,000 tin nhắn real-time được đẩy đi.<br>- 10,000 phút kết nối tổng cộng. | - Tin nhắn: $2.00/1M<br>- Kết nối: $0.08/1M phút | - Tin nhắn: $1.00<br>- Kết nối: ~$0.00<br>**Tổng AppSync: $1.00** |
| **Amazon SES** | 100,000 email gửi đi | 62,000 mail free, sau đó $0.10/1,000 mail | **$3.80** |
| **Amazon DynamoDB** | 100,000 lần đọc cấu hình + 100,000 lần ghi lịch sử (dữ liệu cực nhẹ < 1KB) | Sử dụng chế độ On-Demand (PAYG) | **~$0.50** |
| **MongoDB Atlas** | Dữ liệu Auth & User (chạy gói Free Shared M0 cho môi trường dev/staging) | Miễn phí gói M0 | **$0.00** |
| **TỔNG CỘNG** | **Xử lý thành công 100,000 ảnh/tháng** | | **~$13.75 / tháng** |

> [!NOTE]
> Để duy trì một cụm server truyền thống chạy 24/7 (gồm 1 Web server + 1 Image Processing worker + 1 Socket.io server + 1 DB server) nhằm xử lý lượng tải lớn tương đương, bạn sẽ phải chi trả tối thiểu **$80 - $120/tháng** (chưa tính chi phí cấu hình Auto Scaling và Load Balancer phức tạp). Với Serverless, bạn chỉ tốn **~$14/tháng**.

### 4.3. Các chiến lược Tối ưu hóa Chi phí (Cost Optimization Strategies)

Để giữ hóa đơn AWS luôn ở mức thấp nhất khi hệ thống scale lớn hơn:
1. **S3 Lifecycle Rules (Tối quan trọng):** Thiết lập quy tắc tự động xóa các ảnh trung gian tại thư mục `processed/{jobId}/resize.*`, `filter.*`, và `watermark.*` sau **24 giờ** hoặc **7 ngày**. Hệ thống chỉ cần lưu giữ tệp gốc và tệp `final.*` hoàn chỉnh để phục vụ người dùng. Điều này giảm tới **60% chi phí lưu trữ S3**.
2. **Lambda Power Tuning:** Sử dụng công cụ mã nguồn mở *AWS Lambda Power Tuning* để chạy thử nghiệm các mức cấu hình RAM (từ 256MB đến 2GB) cho các hàm xử lý ảnh. Đôi khi cấp phát RAM gấp đôi (1024MB lên 2048MB) sẽ giảm thời gian thực thi đi hơn một nửa, giúp chi phí thực tế (GB-seconds) rẻ hơn mà tốc độ xử lý nhanh hơn.
3. **DynamoDB TTL (Time-to-Live):** Kích hoạt TTL cho bảng ghi nhật ký lịch sử gửi thông báo `notification-serverless-dev-history`. Tự động xóa các log lịch sử sau **30 ngày** để giải phóng dung lượng lưu trữ DynamoDB hoàn toàn miễn phí.

