# Kế hoạch tích hợp `user-service` vào luồng đăng ký / đăng nhập

Tài liệu này mô tả đúng vấn đề hiện tại, cách hiểu đúng luồng hệ thống, phương án giải quyết, các file cần thay đổi và cách triển khai.

## 1) Vấn đề hiện tại

Hiện tại hệ thống đang bị tách thành 2 lớp dữ liệu khác nhau:

- `auth-service` đang xử lý đăng ký / đăng nhập / OTP / JWT.
- `user-service` ở địa chỉ `` đang cung cấp API CRUD người dùng, trong đó `POST /users` tạo hồ sơ người dùng mới và `GET /users` / `GET /users/{id}` lấy thông tin người dùng.

Điểm quan trọng là luồng đăng ký hiện tại của `auth-service` chưa tạo user thật ngay lập tức. Trong `auth-service/controller/authController.js`, route `POST /auth/register` chỉ:

- kiểm tra `name`, `email`, `password`
- tạo bản ghi `PendingRegistration`
- gửi OTP qua email
- trả về thông báo yêu cầu xác thực OTP

Tức là, về mặt nghiệp vụ, bước `/auth/register` hiện chỉ là “khởi tạo đăng ký”, chưa phải “tạo user hoàn tất”. User chỉ được tạo bên `auth-service` khi OTP được verify trong `verifyOtp`.

## 2) Hiểu đúng vấn đề

Bạn muốn 2 việc:

1. Khi đăng ký xong thì lưu thêm dữ liệu sang `user-service` để có hồ sơ người dùng.
2. Khi đăng nhập xong thì lấy thông tin user từ `user-service` thay vì chỉ dựa vào dữ liệu auth.

Vấn đề kỹ thuật nằm ở chỗ:

- `auth-service` và `user-service` đang là 2 hệ thống độc lập.
- `auth-service` login hiện trả về user từ database auth nội bộ.
- `user-service` lại có schema riêng: `username`, `email`, `fullName`, `phoneNumber`.
- Hai service này chưa có khóa liên kết thống nhất nếu chỉ dùng `id` nội bộ.

Nếu không thiết kế rõ “nguồn sự thật” thì rất dễ xảy ra:

- tạo 2 bản ghi cho cùng một người dùng
- dữ liệu auth và profile lệch nhau
- login xong không biết lấy user-service theo key nào

## 2.1) Auth-service sẽ lưu gì trong DB?

Nếu nhìn riêng phần `auth-service`, DB của nó không phải để lưu profile đầy đủ như `user-service`, mà chủ yếu để phục vụ xác thực và trạng thái đăng nhập. Trong repo hiện tại, auth-service đang lưu 3 nhóm dữ liệu chính:

### `User` collection

Đây là bản ghi user phục vụ xác thực, dùng cho đăng ký, OTP, login và refresh token. Schema hiện tại gồm:

- `name`: tên hiển thị hoặc tên tài khoản
- `email`: email đăng nhập, có ràng buộc unique
- `password`: mật khẩu đã hash bằng bcrypt
- `googleId`: định danh nếu đăng nhập bằng Google
- `role`: vai trò người dùng, mặc định là `user`
- `isVerified`: cờ xác thực email/OTP
- `refreshToken`: refresh token để duy trì phiên đăng nhập

Ý nghĩa thực tế:

- `password` không lưu plain text, chỉ lưu hash.
- `isVerified` dùng để biết user đã xác thực OTP hay chưa.
- `refreshToken` được cập nhật sau khi login để cấp session dài hạn.

### `PendingRegistration` collection

Collection này chỉ dùng tạm thời trong luồng đăng ký OTP. Nó lưu:

- `name`
- `email`
- `passwordHash`
- `otpHash`
- `otpExpiresAt`

Ý nghĩa thực tế:

- Khi user đăng ký, auth-service chưa tạo user chính thức ngay.
- Hệ thống lưu thông tin tạm + OTP hash để chờ người dùng xác minh.
- Nếu OTP đúng, auth-service mới chuyển dữ liệu từ `PendingRegistration` sang `User`.

### `PasswordResetToken` collection

Collection này phục vụ quên mật khẩu / reset mật khẩu. Nó lưu:

- `email`
- `tokenHash`
- `expiresAt`

Ý nghĩa thực tế:

- Khi người dùng yêu cầu reset password, auth-service tạo token tạm.
- Token chỉ có thời hạn ngắn để đảm bảo an toàn.
- Sau khi reset xong thì token bị xóa.

### Tóm lại auth-service lưu gì

Auth-service chỉ nên lưu những thứ liên quan đến:

- xác thực danh tính
- OTP / pending registration
- mật khẩu hash
- refresh token
- trạng thái verified
- token khôi phục mật khẩu

Auth-service **không nên** lưu đầy đủ hồ sơ nghiệp vụ như số điện thoại, tên đầy đủ mở rộng, trạng thái profile chi tiết, vì những dữ liệu đó thuộc về `user-service`.

## 3) Phương án giải quyết đề xuất

### Phương án khuyến nghị

Tách rõ vai trò:

- `auth-service`: quản lý xác thực, OTP, mật khẩu, session/JWT.
- `user-service`: quản lý hồ sơ người dùng.
- `auth-frontend-next`: điều phối chuỗi gọi API giữa hai service.

### Luồng đăng ký đề xuất

1. Frontend gọi `POST /auth/register` để khởi tạo đăng ký và gửi OTP.
2. Người dùng nhập OTP.
3. Sau khi `POST /auth/verify-otp` thành công, frontend gọi `POST /users` của `user-service` để tạo hồ sơ người dùng.
4. Nếu cần, frontend lưu hoặc đồng bộ `authUserId` / `email` vào hồ sơ người dùng để map về sau.

### Luồng đăng nhập đề xuất

1. Frontend gọi `POST /auth/login` để lấy access token.
2. Sau khi login thành công, frontend gọi `GET /users?email=...` hoặc `GET /users/{id}` để lấy hồ sơ người dùng từ `user-service`.
3. Gộp dữ liệu auth + profile vào state của ứng dụng.

### Vì sao không nên tạo user-service record ngay ở bước `/auth/register`

Vì `/auth/register` hiện chỉ là bước gửi OTP, chưa xác minh người dùng thật sự. Nếu tạo hồ sơ user ngay lúc đó thì sẽ phát sinh user “treo” khi OTP không được verify.

Do đó, về mặt nghiệp vụ, bước hợp lý hơn là:

- đăng ký xong OTP
- verify OTP xong mới tạo user profile

Nếu vẫn muốn tạo ngay sau `/auth/register`, cần có cơ chế rollback / compensation khi OTP thất bại hoặc người dùng bỏ dở.

## 4) Pattern / công nghệ được dùng và mục đích

- **Service separation**: tách auth và profile để dễ bảo trì.
- **Orchestration ở frontend**: frontend gọi hai service theo thứ tự, không cần sửa nhiều backend.
- **REST API integration**: dùng `POST /users` và `GET /users` từ user-service.
- **Email OTP**: xác minh đăng ký trước khi tạo profile hoàn chỉnh.
- **Environment-based config**: tách URL auth-service và user-service bằng biến môi trường.

## 5) Các file cần thay đổi khi thực hiện

### Ở frontend

- `auth-frontend-next/src/api/authApi.ts`
  - thêm client cho `user-service`
  - thêm hàm `createUser`
  - thêm hàm `getUserByEmail` hoặc `findUserByEmail` nếu dùng login để fetch profile
  - chuẩn hóa payload `CreateUserDto`

- `auth-frontend-next/src/pages/RegisterPage.tsx`
  - gọi `authApi.register`
  - nếu theo phương án khuyến nghị: gọi `authApi.createUser` sau khi verify OTP thành công, không phải ngay sau register
  - bổ sung field `phoneNumber` nếu cần

- `auth-frontend-next/src/pages/LoginPage.tsx`
  - sau khi `authApi.login` thành công, gọi `user-service` để lấy user profile
  - lưu profile vào state/store

- `auth-frontend-next/src/store/authSlice.ts`
  - nếu muốn lưu thêm `profile` riêng ngoài `auth user`

- `auth-frontend-next/src/store/authStorage.ts`
  - nếu muốn persist thêm user profile trong local storage/session storage

- `auth-frontend-next/.env`


### Ở backend auth-service

- `auth-service/controller/authController.js`
  - chỉ cần sửa nếu muốn backend tự orchestrate tạo user profile thay vì frontend

- `auth-service/router/authRoutes.js`
  - chỉ cần sửa nếu muốn thêm endpoint sync/callback

### Ở user-service

- Không bắt buộc sửa nếu endpoint `POST /users` và `GET /users` đã đúng schema như docs.
- Chỉ cần đảm bảo API chấp nhận payload:

```json
{
  "username": "hoang_user",
  "email": "hoang@example.com",
  "fullName": "Nguyễn Văn Hoàng",
  "phoneNumber": "0901234567"
}
```

## 6) Điểm cần chốt về mapping dữ liệu

API `POST /users` yêu cầu các field sau:

- `username`
- `email`
- `fullName`
- `phoneNumber`

Trong khi form đăng ký hiện có:

- `name`
- `email`
- `password`
- `phoneNumber`

Vì vậy cần map:

- `fullName` = `name`
- `username` = sinh tự động từ `name` hoặc `email`
- `email` = email người dùng nhập
- `phoneNumber` = số điện thoại người dùng nhập

## 7) Cách triển khai

### Bước 1: Khai báo biến môi trường

Thêm vào `auth-frontend-next/.env`:

```dotenv

```

### Bước 2: Tạo lớp client cho user-service

- Tạo hoặc mở rộng `authApi.ts`
- thêm hàm gọi `POST /users`
- thêm hàm gọi `GET /users?email=...` để lấy profile khi login

### Bước 3: Nối luồng đăng ký

Phương án khuyến nghị:

1. `POST /auth/register`
2. verify OTP
3. `POST /users`

### Bước 4: Nối luồng đăng nhập

1. `POST /auth/login`
2. `GET /users?email=...` hoặc `GET /users/{id}`
3. lưu session gồm token + profile

### Bước 5: Kiểm tra trạng thái thất bại

- Nếu auth thành công nhưng user-service lỗi, cần hiển thị thông báo rõ ràng.
- Nếu user-service đã tạo nhưng auth verify fail, cần có chiến lược cleanup hoặc chấp nhận trạng thái pending.

## 8) Rủi ro nếu triển khai sai

- Tạo user profile quá sớm khi OTP chưa verify.
- Login xong nhưng query user-service không đúng khóa định danh.
- Dữ liệu auth và profile lệch nhau.
- Không có cơ chế xử lý khi một service thành công, service còn lại thất bại.

## 9) Kết luận ngắn

Vấn đề không chỉ là “gọi thêm một API”, mà là phải xác định đúng điểm orchestration và khóa liên kết giữa auth-service với user-service.

Khuyến nghị thực tế nhất là:

- giữ `auth-service` cho xác thực
- dùng `user-service` cho hồ sơ người dùng
- frontend hoặc một lớp orchestration riêng sẽ điều phối 2 service này
- tạo user profile sau khi OTP verify thành công, rồi khi login thì fetch profile từ user-service
