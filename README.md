# Block5 Kitchen

Ứng dụng SSR khám phá ẩm thực Sài Gòn và quản trị món ăn, đầu bếp, nguyên liệu. Express + EJS render toàn bộ HTML trên server; không có JavaScript phía client, fetch hoặc AJAX.

## Chạy ngay bản xem trước

Yêu cầu Node.js 24.x và npm.

```sh
npm ci
npm run db:generate
npm run preview
```

Mở http://localhost:3000. Preview **chỉ đọc**, có nhãn trên mọi trang; form lưu/xóa bị khóa và request ghi trả 503. Dữ liệu mẫu lấy từ file local, không phải database Supabase. Không dùng preview để nghiệm thu kết nối/ghi database.

## Kết nối Supabase thật

Project nhóm: `block5-dev`, ref `ewreqsqfiubjmrnynkzv`.

1. Trong Supabase: **Connect → Connection string → Session pooler**, port **5432**. Sao chép chuỗi kết nối và thay mật khẩu đúng của database. Percent-encode ký tự đặc biệt trong mật khẩu.
2. Nếu chưa có `.env`, sao chép `.env.example` thành `.env`. Điền `DATABASE_URL` trên máy, giữ `PREVIEW_MODE=false`. Không gửi chuỗi kết nối vào chat hoặc Git.
3. Chạy các lệnh trong thư mục dự án:

```sh
npm run db:check
npm run db:generate
npm run db:push
npm run db:seed
npm start
```

`db:check` chỉ đọc `SELECT 1`; `db:push` tạo/cập nhật ba bảng theo model code-first, không tự generate client. Không thêm `--force-reset` hoặc `--accept-data-loss`. Mỗi lần sửa model, xem lại thay đổi trước khi chạy trên database nhóm.

Supabase MCP read-only chỉ giới hạn thao tác của công cụ MCP. Prisma dùng quyền riêng của user trong `DATABASE_URL`; kết nối MCP thành công không tự tạo chuỗi kết nối ứng dụng. Không dùng Supabase API URL hoặc publishable key thay cho PostgreSQL connection string.

`npm start` yêu cầu cấu hình database; thiếu cấu hình sẽ dừng và hướng dẫn, không tự chuyển thành preview. Server bind `127.0.0.1` vì admin demo chưa có authentication. Khi đổi port, cập nhật cả `PORT` và `APP_ORIGIN` trong `.env`.

## Công nghệ và cấu trúc

- Node.js 24, Express 5, EJS 3, CSS thuần.
- Prisma 7 với `@prisma/adapter-pg`, PostgreSQL trên Supabase.
- `prisma.config.ts` là file cấu hình công cụ; code ứng dụng và seed là JavaScript ES modules. Generator `prisma-client-js` được dùng để import JavaScript trực tiếp, không thêm build TypeScript.
- `deepmerge-ts` và `mysql2` là overrides dependency gián tiếp để dùng bản vá; phiên bản thực tế ghi trong lockfile.

```text
src/app.js          middleware, cấu hình EJS, routes, lỗi
src/server.js       chọn database/preview, chạy server local
src/routes/        URL và HTTP method
src/controllers/   đọc request, validate, gọi Prisma, render/redirect
src/validators/    kiểm tra input và query
src/db/            PostgreSQL client và preview chỉ đọc
src/views/         HTML EJS, partials, landing, món ăn, quản trị, lỗi
public/            CSS và SVG minh họa
data/              catalog Michelin và mẫu demo
prisma/            model và seed code-first
tests/             HTTP tests và integration PostgreSQL
```

Luồng: **Browser → Router → Controller → Prisma → PostgreSQL → Controller → EJS → HTML → Browser**. Controllers gọi trực tiếp Prisma; không thêm service/repository chỉ chuyển tiếp. EJS không truy vấn database. Mỗi tiến trình chỉ có một Prisma client.

## Model

Ba bảng độc lập trong schema `public`, không có foreign key/cascade, không đặt unique cho tên:

| Model / bảng | Cột |
| --- | --- |
| Dish / dishes | id Int PK tự tăng; name String; description String nullable; price Int; category String nullable; available Boolean default true; imagePath String nullable; createdAt DateTime default now |
| Chef / chefs | id Int PK tự tăng; name String; specialty String nullable; createdAt DateTime default now |
| Ingredient / ingredients | id Int PK tự tăng; name String; unit String; createdAt DateTime default now |

Giá là số nguyên VND. Model trong `prisma/schema.prisma` là nguồn schema. Không thay đổi các schema hệ thống Supabase (`auth`, `storage`, `realtime`, `vault`). Seed tạo 12 món, 4 đầu bếp hư cấu, 10 nguyên liệu. Giá và trạng thái phục vụ là demo. Seed dùng ID cố định và upsert, chạy lại không tăng số bản ghi, **có thể cập nhật bản ghi demo theo ID**; không chạy sau khi nhóm đã thay thế những ID đó bằng dữ liệu thật. Seed tăng sequence để bản ghi CRUD tiếp theo không đụng ID seed.

## Routes và request contract

| Method | URL | Hành vi |
| --- | --- | --- |
| GET | / | Landing, catalog và cảm hứng |
| GET | /dishes?q=... | Tìm món theo tên, không phân biệt hoa thường |
| GET | /dishes/:id | Chi tiết món, đọc lại từ database |
| GET | /admin | Redirect về /admin/dishes |
| GET | /admin/{resource} | Danh sách |
| GET | /admin/{resource}/new | Form thêm |
| POST | /admin/{resource} | Tạo |
| GET | /admin/{resource}/:id | Chi tiết quản trị |
| GET | /admin/{resource}/:id/edit | Form sửa |
| PATCH | /admin/{resource}/:id | Sửa |
| GET | /admin/{resource}/:id/delete | Xác nhận, chưa xóa |
| DELETE | /admin/{resource}/:id | Xóa |

`{resource}` là ba router cố định: `dishes`, `chefs`, `ingredients`.

Form thêm POST; form sửa POST tới `?_method=PATCH`; form xóa POST tới `?_method=DELETE`. Browser vẫn gửi POST, middleware đổi method để khớp router. Override không áp dụng cho GET. Thêm/sửa thành công trả **303** tới chi tiết; xóa trả **303** về danh sách. Tất cả ghi dữ liệu đều await trước redirect.

Trang chủ nhận `destinationQ`, `destinationPage` (6 nhà hàng/trang), `reviewTab=text|gallery`, `reviewPage` (3 nhân vật/trang). Phân trang và toggle là GET; giữ query các phần khác và anchor. Query sai kiểu/giá trị trả 400; trang hợp lệ vượt giới hạn hiển thị empty state.

## Validation và lỗi

- Tên bắt buộc, trim, tối đa 120 ký tự; không unique.
- Mô tả 2.000 ký tự; loại món 80; chuyên môn 120; đơn vị bắt buộc, tối đa 30.
- Giá phải có giá trị, nguyên, 0–2.147.483.647; giá trống không chuyển thành 0.
- Checkbox có giá trị `true`; vắng mặt thành false.
- Ảnh chỉ nhận một đường dẫn trong danh sách SVG local.
- Field text/query chỉ nhận chuỗi đơn; array/object bị từ chối. Query tìm kiếm tối đa 120 ký tự.
- Input sai: **400**, giữ giá trị đã nhập và lỗi theo field, không ghi database.
- ID sai/không có hoặc bản ghi vừa bị xóa: **404**.
- Lỗi database: **500**, thông báo chung; log chỉ method/path/error code, không log secret hay err.message.
- Preview ghi dữ liệu: **503**; origin khác APP_ORIGIN trên request ghi: **403**.

Prisma dùng truy vấn có tham số. Không truyền nguyên req.body vào create/update; không nối input vào SQL. Dữ liệu EJS escape bằng `<%= %>`; `<%- %>` chỉ include partial của ứng dụng. CSP chặn script; form body tối đa 32KB; `.env` gitignore. Kiểm tra Origin khi có header, không thay thế authentication/CSRF protection của ứng dụng production.

PRG ngăn Reload gửi lại thao tác ghi đã redirect; **không ngăn hai lần submit đồng thời**. Bài tập chưa có account/session, giỏ hàng, đặt bàn, thanh toán hoặc booking. Không publish admin này lên Internet trước khi bổ sung xác thực và quyền truy cập.

## Dữ liệu và ảnh

`data/michelin-restaurants.json` là bản sao file người dùng cung cấp, có **36 nhà hàng**. Dùng chỉ đọc ở landing, không nhập vào Dish. Tên là tên nhà hàng; khoảng giá không phải giá từng món. Không suy diễn tên món/địa chỉ/đầu bếp từ ảnh.

- Giá min=0: “Dưới …”; max=null: “Từ …”.
- Ảnh Michelin dùng nguyên URL trong file và giữ link nguồn. Ảnh là ảnh trong hồ sơ nhà hàng, nhãn lấy từ photo_type; không bảo đảm tên món cụ thể.
- Ảnh cảnh quan và showcase là placeholder Unsplash, URL cố định trong EJS. Không đại diện cho cảnh Sài Gòn hay món thật của dự án. Dịch vụ ảnh có thể thay đổi/không truy cập; nền SVG local làm fallback.
- SVG món và phong cảnh local là minh họa tự tạo; ảnh món không phải ảnh chụp thực tế.
- Nhân vật/review hư cấu, ghi rõ minh họa. Không có nút play/video giả.

## Kiểm thử

```sh
npm test
```

HTTP tests dùng test double **riêng, không phải Supabase**: kiểm tra landing, GET tìm kiếm/phân trang, CRUD cả ba model, override, PRG, validation, XSS, 400/403/404/500/503, giới hạn body và preview. Không xem bộ test này là bằng chứng đã ghi database thật.

Integration thật (tùy chọn): đặt `TEST_DATABASE_URL` trong `.env` tới database test có quyền tạo schema rồi chạy:

```sh
npm run test:db
```

Test tạo schema `block5_test_<uuid>` riêng, `db push` vào đó, chạy seed hai lần, kiểm tra số lượng/sequence và CRUD qua Prisma, rồi xóa **chỉ schema test mới tạo**. Không dùng schema public. Nếu không có TEST_DATABASE_URL, test hiển thị skip. Không chạy integration trên môi trường production.

Checklist thao tác:

1. Mở danh sách, tìm món và xem chi tiết.
2. Thêm hợp lệ → 303 → bản ghi xuất hiện; Reload không tăng số bản ghi.
3. Sửa bằng form override PATCH; checkbox bỏ chọn thành false.
4. Nhập sai → 400, input còn nguyên và database không thay đổi.
5. GET xác nhận xóa chưa xóa; xác nhận DELETE → 303 về danh sách.
6. ID sai/không có → 404; database down → 500 chung.
7. Làm cùng luồng cho chefs và ingredients.
8. Kiểm tra 375px, 768px, 1440px, focus bàn phím, empty state, fallback ảnh và prefers-reduced-motion.

## Làm nhóm

Mời mỗi thành viên vào organization Supabase bằng tài khoản riêng. Chia sẻ code/schema/lockfile qua Git; mỗi người tự cấu hình `.env` tới project chung. Thống nhất một người chạy thay đổi schema và seed, xem diff trước khi db push. Không sửa bảng thủ công rồi để Prisma schema lệch database. Khi cần lịch sử thay đổi cho production, chuyển sang migration workflow riêng; db push ở đây theo yêu cầu bài tập.

## Trạng thái bàn giao

Code ứng dụng, Prisma schema, seed, catalog và preview đã được chuẩn bị. Cấu hình Supabase ứng dụng phụ thuộc `DATABASE_URL` do người dùng điền trên máy. Xem `VERIFICATION.md` để phân biệt kiểm tra đã chạy với kiểm tra database còn thiếu.
