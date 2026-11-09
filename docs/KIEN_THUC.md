# Kiến thức quan trọng cần nhớ

## 1. Luồng hoạt động

**SSR:** request → Express router → controller truy vấn DB → EJS tạo HTML → trình duyệt. Code ở `legacy/src/`.

**SPA:** React gọi API bằng `fetch` → server kiểm tra quyền/dữ liệu → truy vấn DB → trả JSON → React cập nhật giao diện. AJAX giúp cập nhật một phần trang mà không tải lại toàn bộ.

HTTP: `GET` đọc, `POST` tạo, `PATCH` sửa, `DELETE` xóa. `400` dữ liệu sai; `401` chưa xác thực; `403` thiếu quyền/form không hợp lệ; `404` không tồn tại; `429` quá nhiều yêu cầu. SSR dùng `303` chuyển trang sau POST để tránh gửi lại form khi refresh.

## 2. Database

PostgreSQL lưu dữ liệu; Supabase cung cấp PostgreSQL và dịch vụ liên quan. Schema là nhóm bảng: `public` chứa danh mục, `block8_auth` chứa xác thực SSR. Prisma hỗ trợ truy cập/model; SSR còn dùng SQL qua `pg`.

Khóa chính xác định một dòng; khóa ngoại liên kết bảng. Món ăn liên kết nhà hàng, đầu bếp; món–nguyên liệu dùng bảng trung gian. **Migration sửa cấu trúc; seed thêm dữ liệu mẫu.** Server phải validation dữ liệu và dùng SQL có tham số.

## 3. Xác thực và mật khẩu

Đăng ký → user `pending` → gửi OTP → xác minh → `active` → đăng nhập. Nhập lại mật khẩu chỉ đối chiếu, không lưu DB. Mật khẩu dài 15–128 ký tự, phân biệt hoa/thường, không tự bỏ khoảng trắng.

**Hash mật khẩu là scrypt**, không phải Argon2: salt ngẫu nhiên 16 byte, kết quả 64 byte, `N=131072, r=8, p=1`. DB lưu `salt:hash`; đăng nhập băm lại rồi so sánh bằng `timingSafeEqual`. Băm một chiều, không giải mã lấy mật khẩu gốc. Code: `legacy/src/auth/crypto.js`.

**SSR:** trình duyệt giữ cookie `sid`, server giữ dữ liệu session. Request tự gửi cookie; server tìm phiên hợp lệ. Phiên đăng nhập hạn **8 giờ**, ghi nhớ **7 ngày**; đăng xuất hủy session và cookie. Phiên chưa đăng nhập cũng có thể giữ mã CSRF.

**SPA/API:** gửi `Authorization: Bearer <JWT>`. JWT ký HS256, mặc định hạn **15 phút**; payload không được mã hóa để giữ bí mật. Xóa token ở trình duyệt không thu hồi các bản sao đã phát hành. API kiểm tra role; SSR hiện cho tài khoản active dùng CRUD, chưa phân quyền CRUD theo role.

## 4. Bảng xác thực SSR

| Bảng | Dùng để làm gì? |
|---|---|
| `users` | Email, tên, mật khẩu đã băm, role, trạng thái, thời điểm xác minh, phiên bản xác thực |
| `activation` | OTP: user, bản băm, hạn, số lần sai, thời gian khóa/gửi/dùng |
| `resets` | Token đặt lại mật khẩu: `hash`, `user_id`, `expires_at`, `used_at` |
| `session` | `sid`: mã phiên; `sess`: dữ liệu JSON; `expire`: hạn dùng |
| `limits` | `key`: email/IP và thao tác; `count`: số lần; `started_at`, `locked_until` |
| `mail_cooldowns` | `key`: email cần gửi lại OTP; `available_at`: lúc được gửi tiếp |

`used_at = NULL` là chưa dùng, vẫn phải kiểm tra hạn. Bảng `captcha` là cách làm cũ; hiện dùng Google reCAPTCHA.

## 5. Bảo vệ và thời hạn

- **OTP:** 6 số, hạn **10 phút**; sai 5 lần khóa **15 phút**; gửi lại cách **60 giây**, giữ số lần sai. DB lưu HMAC-SHA256 gắn với user.
- **Quên mật khẩu:** token ngẫu nhiên, DB lưu SHA-256; hạn **15 phút**, dùng một lần. Link mới gửi thành công hủy link cũ. Đổi mật khẩu thu hồi session SSR; JWT cũ còn hiệu lực tới khi hết hạn.
- **CAPTCHA SSR:** đăng ký cần xác minh; đăng nhập bình thường không hiện. Trong 15 phút, sau **3 lần sai/email hoặc 10/IP** mới yêu cầu; đạt **10/email hoặc 50/IP** thì khóa. Server xác minh với Google, refresh không xóa lịch sử.
- **CSRF:** mã gắn session kiểm tra form ghi dữ liệu; kiểm tra Origin bổ sung. Cookie `HttpOnly` ngăn JS đọc, `Secure` chỉ gửi qua HTTPS, `SameSite` hạn chế gửi trong một số ngữ cảnh khác site.
- Xác thực là “bạn là ai”; phân quyền là “được làm gì”. Kiểm tra ở server, không chỉ ẩn nút. Không đưa mật khẩu hoặc secret vào frontend/Git.

## 6. Tìm kiếm, phân trang và ảnh

Tìm thường so tên; toàn văn tìm từ trong tên/mô tả; gần đúng hỗ trợ một số lỗi gõ. Server paging chọn dữ liệu trong SQL (`LIMIT/OFFSET`); client paging nhận danh sách rồi chia trang. Phân trang số, tải thêm, cuộn vô hạn là cách hiển thị.

Danh sách món dùng SQL paging + AJAX; danh sách nhà hàng trang chủ còn có phần lọc/cắt trong JavaScript backend. Ảnh có thể được gọi từ URL lưu trong database, không xuất hiện trực tiếp trong source. Nguồn ảnh ở `api/data/`, allowlist ở `shared/image-sources.js`; dữ liệu minh họa phải có nhãn, không suy ra giá món từ giá quán.
