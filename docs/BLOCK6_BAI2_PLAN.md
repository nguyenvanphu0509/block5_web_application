# Kế hoạch Block 6 cho Bài 2 — JWT cho bản CSR

## 1. Phạm vi và quyết định

- Nền tảng giữ nguyên Block 6/7 hiện tại: `api` Express + Prisma và `web` React/Vite ở hai origin.
- Chuyển xác thực của SPA sang **JWT Bearer** qua header `Authorization: Bearer <accessToken>`.
- Không dùng session, cookie phiên hoặc CSRF token cho luồng CSR.
- **Không triển khai MFA** theo yêu cầu của nhóm. Vì vậy không thêm OTP, TOTP, recovery code, challenge MFA hoặc các màn hình MFA. Đây là sai khác có chủ đích so với yêu cầu đầy đủ của Bài 2 và cần ghi rõ khi nghiệm thu/nộp bài.
- Giữ nguyên hợp đồng CRUD của Block 6: thành công `{ ok: true, data }`, lỗi nghiệp vụ `{ ok: false, error: { code, message, fields? } }`; không làm thay đổi tìm kiếm và phân trang của Block 7.
- Không đưa secret JWT, mật khẩu, `DATABASE_URL` hoặc service key vào `web`, bundle, log hay Git.

## 2. Hiện trạng cần xử lý

- `api/src/app.js` hiện mở các endpoint CRUD và CORS mới cho `Content-Type`; chưa có middleware xác thực hoặc `Authorization`.
- `api/prisma/schema.prisma` đã có `Dish.chefId` nhưng chưa có `Dish.status`; chưa có model tài khoản cho API.
- `web/src/AuthContext.jsx` hiện tạo tài khoản và phiên giả trong `localStorage`/`sessionStorage`, không gọi API.
- `web/src/api.js` chưa gắn Bearer token và chưa phân biệt xử lý `401` với `403`.
- `web/src/pages/Admin.jsx` hiện cho phép gọi CRUD mà không có route guard theo role.
- Cần kiểm tra và tái sử dụng phần băm mật khẩu, role và quy tắc quyền trong `legacy/src/auth/`/`legacy/src/controllers/`, nhưng không chép session/cookie/redirect/MFA sang API.

## 3. Kế hoạch triển khai

### Giai đoạn A — Chuẩn bị dữ liệu và cấu hình API

1. Bổ sung biến môi trường backend trong `api/.env.example`:
   - `JWT_SECRET` bắt buộc, chỉ đọc ở backend.
   - `JWT_EXPIRES_IN` với giá trị mặc định ngắn, ví dụ `15m`.
   - Giữ `SPA_ORIGIN` là origin cụ thể, không dùng `*`.
2. Bổ sung `Dish.status` với giá trị `draft`/`published`, `Dish.chefId` là quan hệ tới `Chef`, migration và seed tương ứng.
3. Chọn một bảng `User` dùng chung cho API; nếu không thể dùng chung với ứng dụng SSR thì ghi rõ lựa chọn và lý do. Seed tài khoản với role hợp lệ, không nhận role từ request đăng ký.
4. Không ghi secret thật vào file kế hoạch, mã nguồn, migration, seed hoặc ảnh bằng chứng.

### Giai đoạn B — Xây dựng xác thực JWT trong `api`

1. Tách các hàm dùng chung có kiểu rõ ràng cho:
   - chuẩn hóa email/tên tài khoản;
   - băm và kiểm tra mật khẩu;
   - phát hành JWT;
   - verify JWT với thuật toán cố định, kiểm tra `exp`, `iss`/`aud` nếu cấu hình;
   - tải lại user từ database để role/trạng thái không lấy từ payload chưa kiểm chứng.
2. Thêm `POST /api/auth/register`:
   - luôn gán role mặc định `viewer`;
   - trả đúng lỗi validation/trùng tài khoản;
   - không tự đăng nhập nếu chính sách kích hoạt chưa cho phép.
3. Thêm `POST /api/auth/login`:
   - mật khẩu đúng và tài khoản hợp lệ mới trả `accessToken`;
   - sai thông tin trả `INVALID_CREDENTIALS` với status/shape theo hợp đồng đã công bố;
   - không tạo token cho tài khoản pending/không hoạt động;
   - không có nhánh MFA vì MFA nằm ngoài phạm vi.
4. Thêm middleware `requireAuth` và `requireRole`:
   - thiếu/sai/hết hạn/sửa token trả `401`;
   - có danh tính nhưng thiếu quyền trả `403`;
   - không tin `role`, `chefId`, `status` từ body hoặc payload chưa verify.
5. Cập nhật CORS cho preflight có `Authorization` trong `Access-Control-Allow-Headers`, vẫn giới hạn origin cụ thể.

### Giai đoạn C — Áp dụng quyền cho resource API

1. Giữ công khai:
   - `GET /api/dishes`
   - `GET /api/dishes/:id`
   - toàn bộ query tìm kiếm, lọc và phân trang hiện có.
2. Bảo vệ toàn bộ thao tác ghi và các endpoint quản trị bằng token.
3. Áp dụng RBAC/ABAC theo role và thuộc tính món:
   - kiểm tra bản ghi hiện tại từ database trước `PATCH`/`DELETE`;
   - chef chỉ thao tác món được gán cho mình theo chính sách;
   - kiểm tra `status`/`chefId` server-side;
   - giữ nguyên `NOT_FOUND`, `VALIDATION_FAILED` và không đổi dữ liệu khi trả `403`.
4. Đảm bảo mọi route mới và route hiện tại đều đi qua middleware đúng thứ tự: xác thực → role → tìm bản ghi → kiểm tra thuộc tính → nghiệp vụ.

### Giai đoạn D — Chuyển React SPA sang JWT

1. Thay logic tài khoản giả trong `web/src/AuthContext.jsx` bằng gọi API login/register; lưu tối thiểu `accessToken` và thông tin user cần cho giao diện.
2. Chọn `sessionStorage` làm mặc định để giảm thời gian tồn tại token sau khi đóng tab; ghi quyết định, giới hạn XSS và lý do trong tài liệu nộp. Không coi việc ẩn nút là biện pháp phân quyền.
3. Cập nhật `web/src/api.js`:
   - tự gắn `Authorization` khi có token;
   - xử lý `401`: xóa token và chuyển về login;
   - xử lý `403`: giữ token và hiển thị thiếu quyền;
   - giữ nguyên cách đọc lỗi nghiệp vụ của Block 6.
4. Thêm các form/trạng thái cần cho đăng nhập, đăng ký, logout và lỗi API; không thêm form OTP/MFA.
5. Bảo vệ `/admin/*` bằng route guard; ẩn/hiện nút theo role chỉ là UX, quyết định cuối cùng vẫn ở API.

### Giai đoạn E — Kiểm thử và bằng chứng

1. Chạy kiểm thử API trước bằng HTTP tool/curl hoặc Supertest, sau đó mới kiểm thử SPA.
2. Kiểm tra:
   - CRUD không token → `401`;
   - role thấp hoặc sai thuộc tính → `403`, dữ liệu không đổi;
   - JWT bị sửa/hết hạn → `401`;
   - đổi role trong storage hoặc payload → không tăng quyền;
   - preflight `OPTIONS` với `Authorization` → thành công, origin cụ thể;
   - GET món ăn không token vẫn giữ tìm kiếm/phân trang Block 7;
   - đăng ký gửi `role: admin` vẫn tạo role mặc định `viewer`;
   - sai mật khẩu không trả token;
   - secret/password/token không xuất hiện trong log, bundle hoặc payload nhạy cảm.
3. Chạy các lệnh tối thiểu sau khi triển khai:

   ```sh
   npm run db:generate
   npm run build
   npm run test:api
   npm test
   npm run test:e2e
   ```

4. Bằng chứng cần che token, mật khẩu, secret và thông tin kết nối:
   - request/response trực tiếp;
   - Network và Application Storage;
   - ảnh giao diện login/admin;
   - kiểm tra database role/status;
   - sơ đồ luồng JWT và bảng file đã sửa;
   - một lỗi cố ý do agent tạo ra, cách tái hiện và bằng chứng sau khi sửa.

## 4. Tiêu chí hoàn thành

- API và SPA chạy được ở hai origin, CORS hoạt động với Bearer token.
- Token chỉ được cấp sau đăng nhập hợp lệ, verify đúng chữ ký/thuật toán/thời hạn.
- Không route ghi hoặc route admin nào bỏ qua xác thực/phân quyền.
- GET món ăn công khai và toàn bộ tìm kiếm/phân trang Block 7 không bị hồi quy.
- `401`, `403`, lỗi nghiệp vụ và response shape nhất quán giữa gọi từ UI và gọi trực tiếp.
- Không còn xác thực giả bằng danh sách user trong browser.
- Có tài liệu nêu rõ lựa chọn `sessionStorage`, rủi ro XSS, chính sách token sau đổi mật khẩu và **lý do loại trừ MFA**.

## 5. Danh sách file dự kiến

- `api/prisma/schema.prisma`, migration và `api/prisma/seed.js`
- `api/src/app.js` và các module mới cho auth/JWT/middleware
- `api/.env.example`
- `web/src/api.js`, `web/src/AuthContext.jsx`, route guard và các trang auth/admin
- `tests/` cho API, frontend và E2E
- tài liệu nghiệm thu liên quan trong `docs/`

