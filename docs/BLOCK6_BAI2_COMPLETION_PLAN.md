# Kế hoạch hoàn thiện Bài 2 — JWT cho CSR

## Mục tiêu

Hoàn thiện các phần còn thiếu sau khi rà soát sản phẩm hiện tại, nhưng vẫn giữ quyết định **không triển khai MFA**. Không thay đổi hợp đồng CRUD và không làm hồi quy tìm kiếm/phân trang Block 7.

## Trạng thái hiện tại

- JWT HS256, kiểm tra chữ ký và `exp`: đã có.
- CORS và Bearer header: đã có.
- Login/register cơ bản: đã có.
- RBAC cơ bản: đã có.
- ABAC theo chủ sở hữu món: chưa hoàn thiện.
- Seed user theo role: chưa có.
- Activation/reset password: chưa có.
- Xử lý 401 toàn cục ở SPA: chưa hoàn thiện.
- Frontend `/dishes` vẫn yêu cầu đăng nhập: cần đối chiếu và sửa theo yêu cầu trang đọc công khai.
- Test nghiệm thu JWT: chưa có đầy đủ.

## Giai đoạn 1 — Chuẩn hóa dữ liệu người dùng và role

### Việc cần làm

1. Hoàn thiện model `User`:
   - xác định các giá trị role hợp lệ: `admin`, `editor`, `chef`, `viewer`;
   - xác định trạng thái: `active`, `pending`, `disabled`;
   - thêm `tokenVersion` nếu dùng để vô hiệu hóa JWT sau đổi mật khẩu.
2. Bổ sung seed an toàn cho bốn role:
   - không ghi mật khẩu plaintext vào mã nguồn;
   - đọc mật khẩu seed từ biến môi trường;
   - chỉ tạo tài khoản nếu chưa tồn tại;
   - ghi rõ thông tin đăng nhập demo trong tài liệu local, không commit secret thật.
3. Cập nhật `.env.example` với các biến seed tùy chọn.
4. Bổ sung migration/schema nếu thêm `tokenVersion` hoặc bảng activation/reset.

### Tiêu chí nghiệm thu

- Có thể kiểm thử ít nhất `viewer`, `chef`, `editor`, `admin`.
- Request đăng ký gửi `role: admin` vẫn tạo `viewer`.
- Không có mật khẩu seed hoặc secret JWT trong bundle frontend.

## Giai đoạn 2 — Hoàn thiện RBAC và ABAC ở API

### Việc cần làm

1. Tách policy thành module riêng, ví dụ `api/src/auth/policy.js`.
2. Áp dụng thứ tự kiểm tra thống nhất:

   ```text
   Bearer token → verify JWT → tải user database → role → tìm bản ghi → thuộc tính → nghiệp vụ
   ```

3. Giữ quyền RBAC:
   - `viewer`: chỉ đọc dữ liệu công khai;
   - `chef`: tạo/sửa món theo chính sách chef;
   - `editor`: quản lý nội dung;
   - `admin`: toàn quyền quản trị.
4. Implement ABAC:
   - chef chỉ được sửa/xóa món có `dish.chefId === req.user.chefId`;
   - không tin `chefId`, `status`, `role` từ body để quyết định quyền;
   - `PATCH` phải đọc bản ghi hiện tại từ database trước khi kiểm tra;
   - món `published` và `draft` phải tuân theo policy đã công bố;
   - dữ liệu không được thay đổi khi trả `403`.
5. Bảo vệ mọi endpoint ghi, không chỉ các route hiện đang có trong vòng lặp resource.
6. Giữ `GET /api/dishes` và `GET /api/dishes/:id` công khai; các endpoint quản trị khác yêu cầu token theo policy.

### Tiêu chí nghiệm thu

- Chef sửa món của mình: thành công.
- Chef sửa món của chef khác: `403`, dữ liệu giữ nguyên.
- Viewer gọi endpoint ghi: `403`.
- Token bị sửa/hết hạn/thiếu: `401`.
- Thay role trong JWT payload hoặc localStorage/sessionStorage không tăng quyền.

## Giai đoạn 3 — Vòng đời tài khoản, không bao gồm MFA

### Phạm vi giữ lại

- Không thêm OTP, TOTP, recovery code, MFA challenge hoặc giao diện MFA.

### Việc cần làm

1. Đăng ký:
   - chuẩn hóa email;
   - kiểm tra mật khẩu;
   - tạo role `viewer`;
   - quyết định rõ tài khoản tạo mới là `active` hay `pending`.
2. Kích hoạt tài khoản nếu chọn trạng thái `pending`:
   - tạo challenge một lần, lưu hash và hạn dùng;
   - endpoint nhận mã kích hoạt;
   - không trả JWT trước khi tài khoản active.
3. Quên mật khẩu:
   - endpoint tạo reset token một lần;
   - chỉ lưu hash token;
   - có hạn dùng và đánh dấu đã sử dụng;
   - không ghi token/mật khẩu vào log.
4. Đặt lại mật khẩu:
   - cập nhật password hash;
   - tăng `tokenVersion` hoặc áp dụng chính sách hết hạn JWT đã công bố;
   - không dùng reset password làm đường tắt cho MFA vì MFA đã loại trừ.
5. Cập nhật giao diện login/register/forgot/reset tương ứng.

### Tiêu chí nghiệm thu

- Pending login không nhận `accessToken`.
- Reset token dùng lần hai bị từ chối.
- Sau reset password, chính sách JWT cũ được thực hiện đúng và được ghi trong tài liệu.
- Không có secret nhạy cảm trong response/log.

## Giai đoạn 4 — Hoàn thiện xử lý JWT ở SPA

### Việc cần làm

1. Trong API client, xử lý status:
   - `401`: xóa token và user session, phát tín hiệu điều hướng về login;
   - `403`: giữ token, trả lỗi thiếu quyền cho giao diện;
   - lỗi nghiệp vụ khác: giữ nguyên `error.code` và `fields`.
2. Tránh redirect cứng trong lớp API nếu gây phụ thuộc router; dùng callback/auth event hoặc context phù hợp.
3. Khi reload:
   - đọc session;
   - gọi `/api/auth/me`;
   - nếu token không hợp lệ thì xóa session hoàn toàn.
4. Logout phải xóa token và thông tin user.
5. Quyết định công khai frontend:
   - bỏ `ProtectedRoute` khỏi `/dishes` và chi tiết món nếu trang người dùng phải đọc công khai;
   - giữ route guard cho `/admin/*`;
   - không coi việc ẩn nút là biện pháp bảo mật.
6. Giữ lựa chọn `sessionStorage`, ghi rõ rủi ro XSS và lý do trong tài liệu nộp.

### Tiêu chí nghiệm thu

- Token hết hạn trong lúc sử dụng → tự về login.
- `403` không xóa token.
- Người chưa đăng nhập xem được catalog công khai nếu policy đã chọn.
- Người chưa đăng nhập không thể ghi dữ liệu qua UI hoặc gọi API trực tiếp.

## Giai đoạn 5 — Bổ sung test tự động

### API auth/JWT

- register hợp lệ;
- register trùng email/username;
- register gửi role quản trị trong body vẫn tạo viewer;
- login đúng trả token;
- login sai không trả token;
- pending/disabled không nhận token;
- `/auth/me` thiếu token → `401`;
- token sai chữ ký → `401`;
- token hết hạn → `401`;
- thuật toán JWT không đúng → `401`;
- user bị disabled sau khi cấp token → `401`.

### RBAC/ABAC

- viewer chỉ đọc;
- viewer ghi → `403`;
- chef sửa món của mình;
- chef sửa món người khác → `403`, dữ liệu không đổi;
- editor/admin theo policy;
- role giả trong payload không có tác dụng.

### CORS và SPA

- origin hợp lệ → có `Access-Control-Allow-Origin`;
- origin lạ → `403`;
- preflight có `Authorization` → `204`;
- header cho phép gồm `Content-Type, Authorization`;
- API client gắn Bearer sau login;
- API client xử lý khác nhau giữa `401` và `403`.

## Giai đoạn 6 — Bằng chứng nghiệm thu

Chuẩn bị bằng chứng đã che password, JWT, secret và thông tin database:

1. Response login có `accessToken`.
2. `Authorization: Bearer ...` trong request tiếp theo.
3. `401` khi thiếu/sai/hết hạn token.
4. `403` khi thiếu role hoặc vi phạm ABAC.
5. Chef sửa món đúng/sai chủ sở hữu.
6. Preflight `OPTIONS` với origin cụ thể.
7. Catalog đọc công khai, tìm kiếm và phân trang không hồi quy.
8. Storage sau login/logout.
9. Danh sách file đã sửa và sơ đồ luồng JWT.
10. Kết quả test và một lỗi cố ý do agent tạo rồi sửa.

## Lệnh kiểm tra cuối

```powershell
npm run db:generate
npm run db:push
npm run build
npm run test:api
npm test
npm run test:e2e
```

## Điều kiện hoàn thành

- Tất cả test mới và test hiện tại đều pass.
- Không còn xác thực giả phía browser.
- API là nơi quyết định cuối cùng cho role và thuộc tính.
- Không có secret trong Git, frontend bundle, log hoặc ảnh nộp.
- MFA được ghi rõ là ngoài phạm vi, không tạo các endpoint/giao diện MFA giả.

