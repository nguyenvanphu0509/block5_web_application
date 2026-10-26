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
- [Bản SSR cũ](legacy/README.md)
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
