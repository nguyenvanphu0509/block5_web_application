# Block 7 — Search + Pagination

Đã bổ sung bốn chế độ tìm kiếm PostgreSQL, ba kiểu phân trang và 1.000 món demo. Hướng dẫn chạy, migration, API, kiểm thử ngắn và bằng chứng nộp: [docs/BLOCK7.md](docs/BLOCK7.md).

```sh
npm run dev
# Kiểm thử trọng tâm Block 7:
npm run build
npm run test:block7
npm run test:e2e:block7
```

# Block 6 — REST API + React SPA

Backend Express/Prisma và frontend React/Vite chạy ở hai origin riêng:

- Frontend: http://localhost:5173
- REST API: http://localhost:3000/api/dishes

## Cấu trúc

```text
block6/
├── api/
│   ├── src/                 # REST API, db/, lib/, validators/, config/
│   ├── prisma/              # Schema, migration, seed
│   ├── data/                # Dữ liệu seed/import và nguồn ảnh
│   ├── scripts/             # Công cụ DB/import
│   ├── prisma.config.ts
│   ├── .env.example         # Mẫu cấu hình backend
│   └── package.json
├── web/
│   ├── src/                 # React, router, trang, API client
│   ├── public/              # CSS và ảnh giao diện
│   ├── .env.example         # URL API công khai
│   └── package.json
├── shared/                  # Validation và chính sách ảnh công khai
├── legacy/                  # Bản SSR Block 5, JavaScript riêng của EJS
├── tests/                   # Unit, HTTP, integration, Playwright
├── docs/
├── scripts/run-block6.js    # Chạy hai ứng dụng
├── package.json             # npm workspaces và lệnh chung
└── package-lock.json        # Một lockfile cho cả project
```

## Chạy

Yêu cầu Node.js 24.x. Cài dependency **một lần tại thư mục gốc**:

```sh
npm ci
```

Nếu chưa có cấu hình backend, sao chép mẫu rồi điền thông tin trên máy:

```sh
cp api/.env.example api/.env
```

Bản local hiện có đã chuyển `.env` sang `api/.env`; không ghi đè file này bằng file mẫu.

```sh
npm run db:generate
npm run dev
```

`npm run dev` chạy API và frontend cùng lúc. Có thể chạy riêng `npm run dev:api` / `npm run dev:web`, hoặc vào `api/` / `web/` rồi chạy `npm run dev`.

- Production: `npm start` tự build rồi chạy hai ứng dụng.
- Chỉ build frontend: `npm run build`.
- Chỉ đọc: `npm run preview` (vẫn cần database).
- Bản EJS cũ: `npm run dev:ssr` hoặc `npm run start:ssr`.

## Database và seed

Prisma ở `api/prisma/`, cấu hình ở `api/prisma.config.ts`, secret ở `api/.env`. Các lệnh từ gốc vẫn giữ nguyên:

| Lệnh | Tác dụng |
|---|---|
| `npm run db:generate` | Sinh Prisma Client |
| `npm run db:check` | Kiểm tra kết nối |
| `npm run db:push` | Đồng bộ schema |
| `npm run db:seed` | Chạy `api/prisma/seed.js` |

Database nhóm đã có dữ liệu: **không cần db:push hoặc seed lại chỉ để chạy website hay sau khi đổi thư mục**.

Với database mới dùng chấm bài, cấu hình `api/.env` trỏ đúng database đó rồi mới chạy `db:push` và `db:seed`. Seed hiện có giữ nguyên snapshot: 87 món, 39 nhà hàng, 13 đầu bếp, 44 nguyên liệu, 248 liên kết món–nguyên liệu, 6 câu chuyện và 36 bản ghi lưu trữ. Không tự chạy seed khi khởi động; không tạo bucket hoặc tải lại ảnh lên Storage.

## Kiểm thử và tài liệu

```sh
npm run build
npm test
npm run test:e2e
npm run test:e2e:production
```

Integration PostgreSQL: đặt `TEST_DATABASE_URL` trong `api/.env`, chạy `npm run test:db:api` hoặc `npm run test:db`. Test tạo/dọn schema riêng, không reset public.

- [API, validation, cấu hình và nghiệm thu Block 6](docs/BLOCK6.md)
- [Block 8 — Restaurant SSR](#block-8--restaurant-ssr)
- [Ghi chú fetch/AJAX và toàn bộ tài liệu trước khi đổi cấu trúc](legacy/README.block5.md)

Các thư mục video/motion hiện có được giữ nguyên. Admin vẫn là demo, chưa thêm đăng nhập/phân quyền hoặc triển khai hosting.

block6/
├── api/
│   ├── src/          # REST API, kết nối DB, validation, storage
│   ├── prisma/       # Schema, migration, seed
│   ├── data/
│   ├── scripts/      # Công cụ database/import
│   ├── .env          # Cấu hình backend đã chuyển sang đây
│   └── package.json
├── web/
│   ├── src/          # React SPA
│   ├── public/       # CSS, ảnh
│   └── package.json
├── shared/
├── legacy/           # Bản SSR cũ
├── tests/
├── docs/
└── package.json      # Lệnh chạy chung, npm workspaces

E2E là kiểm thử cả luồng sử dụng trên trình duyệt; Playwright là công cụ đang dùng để tự mở trang, nhập form và bấm nút kiểm tra.

| File còn giữ trong `tests/` | Công dụng |
|---|---|
| `api.test.js` | Kiểm tra CRUD, validation, CORS và lỗi API |
| `frontend.test.js` | Kiểm tra lớp gọi API và mở/Reload URL frontend |
| `seed.test.js` | Kiểm tra seed không ghi đè hoặc nhân đôi dữ liệu |
| `database.integration.js` | Kiểm tra PostgreSQL thật khi có cấu hình test |
| `fixtures.js` | Database và dữ liệu giả dùng chung |
| `e2e/spa.spec.js` | Kiểm tra các luồng trên trình duyệt |
| `e2e/server.js` | Server riêng phục vụ kiểm thử trình duyệt |


## 
| Chế độ | Tìm ở đâu? | Cách tìm |
|---|---|---|
| **Thông thường** | Tên món | Tìm chuỗi nằm trong tên. Nhập `phở` có thể ra “Phở bò”, “Phở gà”. |
| **Toàn văn** | Tên **và mô tả** | Tìm theo các từ. Ví dụ nhập `thảo mộc` có thể ra món có cụm này trong mô tả, dù tên không chứa nó. Không phải tìm gần đúng. |
| **Gần đúng** | Tên món | Tìm tên có độ giống từ khóa đủ cao, hỗ trợ một số lỗi gõ. Ví dụ `pho boo` có thể tìm được “Phở bò”. |
Cả ba đều hỗ trợ không dấu. Nâng cao hiện là tìm thường kết hợp loại món, khoảng giá và trạng thái.

## 
Số trang: bấm trang 2 → danh sách được thay.
Tải thêm: bấm Tải thêm → danh sách dài thêm.
Cuộn vô hạn: cuộn xuống cuối → tự tải phần tiếp theo.

## 
| Khái niệm | Ý nghĩa |
|---|---|
| **Client paging** | Browser nhận đủ danh sách rồi tự chia trang. |
| **Server paging** | Server chọn phần dữ liệu cần trả cho từng request. |
| **AJAX** | Browser gọi API và cập nhật giao diện mà không tải lại toàn bộ trang. |
Server paging và AJAX có thể dùng cùng nhau. Một cái quyết định nơi chia dữ liệu, một cái quyết định cách cập nhật giao diện.

Ở danh sách món ăn, nhóm em dùng server paging kết hợp AJAX. PostgreSQL chọn dữ liệu bằng LIMIT/OFFSET; React gọi API bằng fetch rồi cập nhật danh sách. Nhóm chọn cách này vì có hơn 1.000 món, không cần tải toàn bộ món về browser mỗi lần

Phạm vi phát biểu cho đúng code hiện tại: danh sách món và quản trị món dùng phân trang SQL. Riêng danh sách nhà hàng ở trang chủ hiện còn lấy dữ liệu rồi lọc/cắt trong JavaScript phía backend; phần đó chưa dùng LIMIT/OFFSET tại PostgreSQL.
##

# Block 8 — Restaurant SSR

Express/EJS chạy độc lập tại http://localhost:3001. SPA/API và các lệnh chạy mặc định vẫn giữ nguyên. SSR dùng chung dữ liệu danh mục với SPA nhưng có hệ thống xác thực, session và CSRF riêng.

## Thiết lập và chạy

Yêu cầu Node.js 24.x. Cài dependency một lần tại thư mục gốc:

```sh
npm ci
```

Tạo `legacy/.env` từ `legacy/.env.example` nếu chưa có, rồi điền cấu hình database, session, SMTP và reCAPTCHA. Không ghi đè `.env` hiện có và không commit secret.

```sh
npm --prefix legacy run auth:migrate
npm --prefix legacy run auth:seed
npm run dev:ssr
```

`auth:migrate` chỉ tạo schema `block8_auth` và các bảng xác thực; startup không tự migrate. Trước khi chạy `auth:seed`, đặt `SSR_SEED_EMAIL` và `SSR_SEED_PASSWORD` trong `legacy/.env`. Mật khẩu seed dài 15–128 ký tự.

Các lệnh SSR:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev:ssr` | Chạy SSR ở chế độ watch tại cổng 3001 |
| `npm run start:ssr` | Chạy SSR production |
| `npm --prefix legacy run auth:migrate` | Tạo/cập nhật schema auth |
| `npm --prefix legacy run auth:seed` | Tạo tài khoản active từ biến môi trường |
| `npm --prefix legacy test` | Chạy toàn bộ test Legacy |
| `npm --prefix legacy run test:flow` | Chạy flow HTTP/browser và mail giả lập |

Production đặt `SSR_ORIGIN` là URL HTTPS thật và cấu hình `SSR_TRUST_PROXY_HOPS` đúng với reverse proxy. Cookie `Secure` chỉ hoạt động đúng khi Express nhận diện request HTTPS.

## Cấu hình reCAPTCHA v2

Google reCAPTCHA v2 checkbox dùng ba biến trong `legacy/.env`:

```env
RECAPTCHA_SITE_KEY=your-public-site-key
RECAPTCHA_SECRET_KEY=your-server-secret
RECAPTCHA_ALLOWED_HOSTNAMES=localhost,127.0.0.1
```

Site key chỉ được render ở frontend. Secret key chỉ được dùng ở backend; server gửi token tới Google `siteverify`, kiểm tra `success` và hostname, đồng thời fail-closed khi token thiếu hoặc Google không phản hồi. Sau khi thay đổi `.env`, phải restart SSR.

Nếu widget không hiện, kiểm tra `RECAPTCHA_SITE_KEY`, Network request tới `https://www.google.com/recaptcha/api.js`, Console và CSP trong `legacy/src/middleware/security.js`. CSP phải cho phép `www.google.com/recaptcha`, `www.gstatic.com/recaptcha` và iframe reCAPTCHA.

## Phạm vi xác thực

- Email được trim và chuyển lowercase; password dài 15–128 ký tự và không tự trim.
- Đăng ký luôn yêu cầu CAPTCHA hợp lệ, tạo user pending và gửi OTP 6 chữ số có hạn 10 phút.
- OTP lưu dạng HMAC, dùng một lần; tối đa 5 lần sai, khóa 15 phút và resend cách nhau ít nhất 60 giây. Kích hoạt thành công không tự đăng nhập.
- Email active đăng ký lại không ghi đè password, không tạo user trùng và không gửi OTP kích hoạt mới.
- Login dùng `crypto.scrypt`; lỗi đăng nhập không tiết lộ tài khoản có tồn tại hay không.
- Rate limit theo email và IP; CAPTCHA được yêu cầu sau ngưỡng sai và không xóa bộ đếm.
- Session lưu PostgreSQL qua `connect-pg-simple`, cookie tên `sid`, `HttpOnly`, `SameSite=Lax`, `Secure` khi HTTPS, hết hạn 8 giờ hoặc 7 ngày khi chọn ghi nhớ.
- Login gọi regenerate session để chống session fixation. Logout hủy session phía server và xóa cookie.
- Reset password dùng token ngẫu nhiên 32 byte, lưu SHA-256, hạn 15 phút và dùng một lần; reset thành công thu hồi toàn bộ session.
- CSRF token áp dụng cho mọi POST/PATCH/DELETE, kể cả multipart; kiểm tra Origin bổ sung.
- Toàn bộ route CRUD được bảo vệ ở server. Request chưa đăng nhập được chuyển `303 /login` trước khi upload hoặc ghi dữ liệu. Block 8 chưa phân quyền CRUD theo role.

## Luồng chính

```mermaid
sequenceDiagram
  participant B as Browser
  participant S as SSR
  participant D as PostgreSQL
  participant M as SMTP
  B->>S: Register + CSRF + reCAPTCHA
  S->>D: Tạo pending user + OTP hash
  S->>M: Gửi OTP
  B->>S: Activate OTP
  S->>D: Consume OTP; active
  B->>S: Login
  S->>D: Kiểm tra giới hạn và tạo session
  S-->>B: Set-Cookie sid; 303 /dishes
  B->>S: CRUD + cookie + CSRF khi ghi
  B->>S: Forgot/reset password
  S->>D: Consume reset token; đổi password; revoke sessions
```

## Kiểm thử và bằng chứng nộp

```sh
npm --prefix legacy test
npm --prefix legacy run test:flow
npm test
npm run build
```

Test flow dùng database/email giả lập; kiểm thử SMTP thật cần thực hiện riêng với hộp thư được phép. Ma trận nghiệm thu gồm đăng ký pending, OTP hết hạn/dùng lại/resend, CAPTCHA sai hoặc hostname sai, brute-force 429, login tạo cookie, restart giữ session, logout/reset thu hồi session, CRUD không session bị chuyển login và CSRF sai bị từ chối.

Khi chụp bằng chứng:

1. Network → `POST /login` → Response Headers → `Set-Cookie`.
2. Application → Cookies → kiểm tra `sid`, `HttpOnly`, `SameSite=Lax`, `Path=/` và `Secure` nếu HTTPS.
3. Request tiếp theo tới `/dishes` có cookie.
4. Database session/auth record và email OTP/reset.
5. Brute-force trả 429, CRUD anonymous trả 303 `/login`, logout và reset làm sid cũ vô hiệu.

Che giá trị cookie, session, password, OTP, reset token và mọi secret trong ảnh hoặc log. Không đưa secret reCAPTCHA/SMTP vào chat, commit hoặc tài liệu nộp.