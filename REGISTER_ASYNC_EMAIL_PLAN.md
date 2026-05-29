# Register OTP Async Email Plan

## 1) Mục tiêu
- Loại bỏ lỗi 500 giả khi người dùng đăng ký thành công nhưng request bị timeout ở gateway/lambda/proxy.
- Giảm thời gian phản hồi API đăng ký về dưới 500ms ở điều kiện bình thường.
- Tách bước gửi OTP email sang nền để backend trả response ổn định hơn.

## 2) Hiện trạng
- API đăng ký hiện xử lý đồng bộ tại [auth-service/controller/authController.js](auth-service/controller/authController.js#L16).
- Trong cùng request, server tạo PendingRegistration rồi gọi gửi email OTP.
- Nếu tầng trước backend có timeout ngắn, có thể xảy ra trường hợp:
1. Email đã gửi thành công.
2. Client vẫn nhận 500 do timeout hoặc proxy đóng kết nối.

## 3) Đề xuất kiến trúc mới
- Tách gửi OTP ra hàng đợi nền.
- API register chỉ tạo dữ liệu pending và đẩy job gửi OTP vào queue.
- Worker nền lấy job từ queue rồi gửi email.

Luồng mới:
1. Client gọi POST /auth/register.
2. Auth service validate input.
3. Auth service tạo hoặc cập nhật PendingRegistration.
4. Auth service đẩy message vào queue OTP.
5. Auth service trả 202 hoặc 201 ngay cho client.
6. Worker xử lý queue, gửi OTP qua email.
7. Worker cập nhật trạng thái gửi vào PendingRegistration.

## 4) Phạm vi thay đổi
- Sửa logic register tại [auth-service/controller/authController.js](auth-service/controller/authController.js#L16).
- Giữ module email tại [auth-service/utils/sendEmail.js](auth-service/utils/sendEmail.js#L1), nhưng chỉ dùng trong worker.
- Mở rộng schema pending registration tại [auth-service/model/pendingRegistration.js](auth-service/model/pendingRegistration.js#L1).
- Có thể bổ sung route kiểm tra trạng thái OTP tại [auth-service/router/authRoutes.js](auth-service/router/authRoutes.js#L1).

## 5) Thiết kế dữ liệu đề xuất
Bổ sung vào PendingRegistration:
- emailStatus: pending | sent | failed
- emailAttemptCount: number
- lastEmailError: string
- otpSentAt: Date

Lợi ích:
1. Biết chính xác email đã gửi chưa.
2. Hỗ trợ retry có kiểm soát.
3. Dễ quan sát lỗi thực tế trong production.

## 6) API contract đề xuất
POST /auth/register:
- Trả 202 Accepted khi job đã được enqueue.
- Message: OTP đang được gửi, vui lòng kiểm tra email sau vài giây.

POST /auth/verify-otp:
- Giữ nguyên contract hiện tại.

Tuỳ chọn bổ sung:
- GET /auth/register-status?email=... để frontend polling tối đa 30-60 giây nếu cần UX rõ hơn.

## 7) Kế hoạch triển khai theo bước
1. Thêm trường trạng thái email vào schema PendingRegistration.
2. Tạo publisher queue trong auth service.
3. Sửa register để enqueue thay vì gửi email trực tiếp.
4. Tạo worker queue để gửi email OTP và cập nhật trạng thái.
5. Thêm retry policy và dead-letter queue.
6. Bổ sung log có correlationId xuyên suốt request và worker.
7. Cập nhật frontend message ở màn hình đăng ký.
8. Triển khai canary cho 10% traffic trước khi rollout toàn bộ.

## 8) Logging và CloudWatch cần có
Auth service:
- register request received
- pending registration upsert success
- otp job enqueue success hoặc enqueue failed

Worker:
- otp email job received
- send email success messageId
- send email failed error
- retry scheduled
- moved to DLQ

Mỗi log nên có:
- requestId hoặc correlationId
- email hash hoặc user key không lộ dữ liệu nhạy cảm
- elapsedMs

## 9) Tiêu chí chấp nhận
1. P95 thời gian register API dưới 500ms.
2. Tỷ lệ lỗi 5xx của register giảm dưới 0.5%.
3. Tỷ lệ gửi OTP thành công trên 99%.
4. Không còn trường hợp người dùng nhận OTP nhưng UI báo Internal Server Error do timeout.

## 10) Rollback plan
1. Giữ cờ cấu hình USE_ASYNC_OTP_EMAIL.
2. Nếu lỗi tăng sau rollout, tắt cờ và quay lại gửi đồng bộ tạm thời.
3. Không xóa dữ liệu PendingRegistration hiện có.
4. Giữ worker chạy drain queue trước khi rollback hoàn toàn.

## 11) Checklist review trước khi code
1. Chốt dùng SQS hay hệ queue hiện có.
2. Chốt status code register là 201 hay 202.
3. Chốt policy retry và DLQ.
4. Chốt có cần endpoint register-status hay chỉ thông báo UX tĩnh.
5. Chốt dashboard và alarm CloudWatch.
6. Chốt kế hoạch migration và rollback.

## 12) Ước lượng
- Refactor register + schema: 0.5 ngày.
- Queue publisher + worker: 1 ngày.
- Logging, metrics, alarm, test: 0.5 đến 1 ngày.
- Tổng: 2 đến 2.5 ngày làm việc.
