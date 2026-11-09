# Hoàn thiện Bài 2 — chính sách nghiệm thu slide 30

## Quyền truy cập

- Mọi tài khoản `active`, kể cả `viewer` và `chef`, đều được tạo, đọc, sửa, xóa dishes/chefs/ingredients/restaurants và vào `/admin/*`. Không giới hạn theo role hoặc chủ sở hữu món.
- Mọi endpoint `/api/chefs` và `/api/ingredients`, gồm collection, chi tiết, GET/HEAD và ghi, yêu cầu JWT. OPTIONS là preflight CORS.
- GET dishes/restaurants, home và config công khai. Ghi luôn yêu cầu JWT của tài khoản active. Preview vẫn chỉ đọc.
- API lấy trạng thái và tokenVersion từ database, không tin role/status trong body hoặc sessionStorage.

## Đăng ký và kích hoạt

- Sau validation và CAPTCHA, email/username mới hoặc đã có đều trả HTTP `200` với cùng body thông báo chung; không trả ID, role hoặc OTP. Đăng ký mới luôn tạo `viewer`, `pending`.
- OTP lưu SHA-256, hạn 15 phút, dùng một lần. Mỗi OTP cho phép tối đa 5 lần sai; lần sai thứ 5 và các lần tiếp theo trả `429 RATE_LIMITED`, kể cả gửi đúng OTP sau khi đã hết lượt. Cần gửi mã mới sau cooldown.
- Resend có cooldown 60 giây, tính cả mã vừa gửi khi đăng ký; gọi sớm trả `429` và `Retry-After`. Mã mới thay mã cũ.

## Login, forgot và JWT

- Login sai 3 lần yêu cầu CAPTCHA theo cấu hình; sai 5 lần khóa 15 phút. Trong thời gian khóa, kể cả đúng mật khẩu cũng trả `429 RATE_LIMITED` với `Retry-After`. Hết khóa cho phép thử lại; login thành công xóa bộ đếm. Bộ đếm và thời điểm khóa lưu trong database; cập nhật được tuần tự hóa bằng khóa hàng.
- Forgot-password gọi lặp trong 60 giây trả `429`, gồm email không tồn tại để tránh phân biệt tài khoản theo cooldown. SMTP chạy nền, phản hồi đầu tiên chung `200`; lỗi SMTP được ghi mã lỗi, không trả chi tiết nhạy cảm. Token cũ chỉ bị dọn sau khi gửi thư mới thành công.
- Cooldown email có lớp bộ nhớ theo process; bản ghi token trong DB tiếp tục chặn gửi sớm khi restart. Muốn chạy nhiều API replica cần kho rate-limit dùng chung cho cả email không tồn tại.
- JWT HS256 có chữ ký hợp lệ nhưng hết hạn trả `401 TOKEN_EXPIRED`. Thiếu token/sai chữ ký, tài khoản pending/disabled hoặc phiên bị thu hồi trả `401 UNAUTHENTICATED`. SPA xóa session và chuyển login khi nhận 401.
- Reset token ngẫu nhiên 32 byte, lưu SHA-256, hạn 15 phút, dùng một lần. Reset thành công **tăng `users.tokenVersion`**, vô hiệu ngay toàn bộ JWT đã cấp trước đó ở mọi tab/thiết bị khi gọi API tiếp theo. Các reset link thuộc phiên bản cũ cũng mất hiệu lực. Người dùng phải đăng nhập lại bằng mật khẩu mới; reset không cấp JWT tự động. Reset cũng xóa khóa login và bộ đếm sai.
- JWT lưu trong sessionStorage theo tab; vẫn cần phòng chống XSS. MFA ngoài phạm vi; OTP kích hoạt không phải MFA.

## Cập nhật database và kiểm tra

Áp dụng migration `api/prisma/migrations/20261109_auth_limits/migration.sql` để thêm `loginLockedUntil` vào DB hiện có, rồi chạy `npm run db:generate` và khởi động lại API. Với DB mới có thể dùng `npm run db:push`.

Chạy `npm test`, `npm run build`; kiểm thử auth dùng `tests/auth.test.js`. Kiểm thử DB thật cần môi trường test riêng; không dùng database nghiệm thu để chạy test phá dữ liệu.
