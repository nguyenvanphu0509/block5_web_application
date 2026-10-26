# Block 6 — REST API + React SPA

Hai ứng dụng chạy độc lập, tổ chức bằng npm workspaces (`api`, `web`, `legacy`), dùng một lần cài dependency và một lockfile ở thư mục gốc. Backend không render HTML; frontend dùng React, Vite và React Router. Schema và các bảng Supabase hiện có được giữ nguyên. Không cần reset, migrate hay seed lại để dùng Block 6.

## Chạy ứng dụng

Yêu cầu Node.js 24.x. Từ thư mục gốc:

```sh
npm ci
npm run db:generate
npm run dev
```

- SPA: http://localhost:5173
- API: http://localhost:3000/api/dishes
- `npm run dev` chạy cả API và Vite. Dừng bằng Ctrl+C.
- Chạy riêng: `npm run dev:api` và `npm run dev:web` ở hai terminal.
- `npm start` build frontend rồi chạy API + server static có fallback production.
- `npm run build` chỉ tạo `web/dist`; `npm run start:api` / `npm run start:web` chạy riêng từng ứng dụng production.
- `npm run preview` chạy hai ứng dụng ở chế độ chỉ đọc, vẫn đọc database thật.

Nếu bản SSR cũ đang chiếm cổng 3000, hãy dừng tiến trình đó trước khi chạy Block 6. Không tự đổi cổng vì CORS cần khớp origin chính xác.

## Cấu hình

Backend đọc `api/.env` theo đường dẫn của module, không phụ thuộc thư mục đang chạy. File local cũ đã được di chuyển nguyên nội dung sang đây; không cần tạo lại hoặc chia sẻ secret:

```dotenv
DATABASE_URL=... # chỉ backend
API_PORT=3000
SPA_ORIGIN=http://localhost:5173
PREVIEW_MODE=false
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=... # chỉ backend, cần cho upload
SUPABASE_STORAGE_BUCKET=dish-images
```

Frontend có mặc định gọi `http://localhost:3000`. Khi cần đổi, tạo `web/.env.local` từ `web/.env.example`:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

Biến `VITE_*` là công khai và được nhúng lúc build. Không đặt database URL hoặc service key trong frontend. Không thêm `/api` vào base URL vì lớp gọi API đã tự thêm.

Production: đặt `SPA_ORIGIN` bằng origin của website; đặt `WEB_API_ORIGIN` cho server static bằng origin API để CSP cho phép kết nối. `WEB_PORT` mặc định là 5173; truyền biến này qua môi trường chạy frontend (không đặt trong `api/.env`). Cấu hình backend không được tự nạp vào tiến trình frontend. Origin gồm protocol, hostname và port: `127.0.0.1` khác `localhost`. Khi dùng reverse proxy/hosting khác, giữ fallback `index.html` cho URL SPA và giữ 404 cho `/api` sai hoặc asset không tồn tại.

## REST contract

Áp dụng cùng bảng cho `dishes`, `chefs`, `ingredients`, `restaurants`:

| Method | URL | `data` thành công |
|---|---|---|
| GET | `/api/{resource}` | Mảng |
| GET | `/api/{resource}/:id` | Bản ghi |
| POST | `/api/{resource}` | Bản ghi vừa tạo |
| PATCH | `/api/{resource}/:id` | Bản ghi sau sửa |
| DELETE | `/api/{resource}/:id` | `null` |

Thành công: HTTP 200, `{ "ok": true, "data": ... }`. Lỗi nghiệp vụ: HTTP 200, `{ "ok": false, "error": { "code", "message", "fields"? } }`. `NOT_FOUND` không có fields; `VALIDATION_FAILED` có fields. `ALREADY_EXISTS` áp dụng cho nguồn Michelin bị trùng.

Sai URL/method: HTTP 404. JSON hỏng: 400. Origin sai: 403. Body quá lớn: 413. Content-Type không hỗ trợ: 415. Storage lỗi: 502/503. Chỉ đọc: 503. Lỗi hệ thống/DB: 500. Các lỗi kỹ thuật này chỉ có message, không có `ok`, không trả stack hoặc secret.

Thêm các endpoint đọc:

| URL | Nội dung |
|---|---|
| `/api/config` | Preview, nguồn ảnh và kiểu sắp xếp công khai |
| `/api/home` | Dữ liệu landing, địa điểm, nhận xét/ảnh |
| `/api/restaurants/suggestions?q=pho` | Tối đa 6 gợi ý nhà hàng |

Query món ăn: `q`, `page`, `sort`, `restaurantId`, `district`, `category`, `chefId`, `ingredientId`, `available`. `q` chỉ tìm tên, không phân biệt dấu/hoa thường. Có `page` thì phân trang 12 món; bỏ `page` thì trả toàn bộ để dùng cho quản trị. `data` luôn là mảng; `meta` chứa count, total, page, pages, pageSize, categories và preview. Bộ sắp xếp mặc định giữ cách xếp trang của bản cũ; các kiểu khác có ID làm thứ tự phụ ổn định. Với catalog học tập hiện tại, API chuẩn hóa tên và lọc tìm kiếm trong bộ nhớ sau truy vấn DB.

Query landing giữ `destinationQ`, `destinationPage`, `reviewTab`, `reviewPage`. Tìm nhà hàng vẫn hỗ trợ tên, khu vực, món nổi bật và ẩm thực.
API chuẩn hóa dữ liệu nhà hàng và tên các món đang liên kết khi tìm kiếm; không phụ thuộc các search trigger của bản Block 5. Vì vậy database mới tạo bằng `db:push` vẫn tìm được bản ghi vừa thêm/sửa.

## Ghi dữ liệu và validation

JSON là định dạng chính. Ví dụ:

```sh
curl -X PATCH http://localhost:3000/api/dishes/1 \
  -H 'Content-Type: application/json' \
  -d '{"available":false,"price":null}'
```

- Tên: bắt buộc khi tạo, trim, tối đa 120 ký tự. Không bắt buộc tên duy nhất.
- Món: mô tả tối đa 2.000 ký tự; loại món tối đa 80; giá integer 0–2.147.483.647 hoặc null; available boolean.
- Đầu bếp: specialty tùy chọn, tối đa 120. Nguyên liệu: unit bắt buộc, tối đa 30.
- Nhà hàng: cuisine bắt buộc; address ≤300, ward/district ≤120, notableDishes là mảng chuỗi với tổng độ dài ≤1000, michelinUrl ≤600 và thuộc hồ sơ Michelin HTTPS.
- ID phải là integer dương trong phạm vi PostgreSQL Int. ID path sai trả NOT_FOUND trước khi truy vấn.
- PATCH bỏ qua trường nào thì giữ nguyên trường đó; `false` được ghi đúng; `ingredientIds: []` xóa liên kết, bỏ ingredientIds giữ liên kết. Trường tùy chọn nhận null để xóa giá trị.
- Field không cho phép như id, createdAt, importKey hoặc object quan hệ thô không được ghi.
- `restaurantId`, `chefId` nhận ID hoặc null; `ingredientIds` là mảng tối đa 100 ID, loại trùng, kiểm tra tồn tại.
- Form có thể gửi `newRestaurantName`, `newChefName`, `newIngredients: [{name, unit}]` (tối đa 20). Không vừa chọn cũ vừa tạo mới cho cùng nhà hàng/đầu bếp. Đơn vị mới để trống mặc định “phần”. Thêm nguyên liệu mới khi PATCH không gửi ingredientIds sẽ nối vào liên kết hiện tại.
- Tạo/sửa món kèm quan hệ chạy trong một transaction. Không lưu bản ghi cha dở dang khi có lỗi.
- Xóa chef/restaurant đặt FK ở món thành null; xóa ingredient/dish dọn bảng nối, giữ các bản ghi liên quan khác.

Upload multipart có đúng hai field: `payload` (chuỗi JSON) và `imageFile` (JPG/PNG/WebP ≤5 MB). Không tự đặt Content-Type multipart trong browser. Backend xác thực payload/file rồi upload qua service key. Lưu DB lỗi thì thử dọn file mới; lỗi dọn chỉ ghi log an toàn.

Không gửi ảnh mới hoặc gửi imagePath rỗng thì giữ ảnh cũ; gửi imagePath null có chủ đích thì xóa URL. Không đồng thời gửi file và URL khác rỗng. Chỉ chấp nhận URL ảnh từ các nguồn đã duyệt và ảnh local hiện có. Kiểm tra loại file theo MIME như bản SSR; chưa có cơ chế phân tích nội dung ảnh hoặc thu gom các ảnh cũ không còn được tham chiếu.

## SPA và cấu trúc

- `api/src/`: REST API, catalog, validation, `db/`, `lib/` và `config/env.js`.
- `api/prisma/`: schema, migration, seed; `api/prisma.config.ts`: cấu hình CLI.
- `api/data/` và `api/scripts/`: dữ liệu/công cụ backend; script chạy trực tiếp vẫn đọc `api/.env`.
- `web/src/`: router, lớp gọi HTTP, hook tải dữ liệu, trang công khai/quản trị, form và component giao diện.
- `shared/resources.js`: metadata và validation thuần dùng chung API/browser.
- `web/public/`: CSS và ảnh; JavaScript riêng của EJS nằm ở `legacy/public/js/`.
- `shared/image-sources.js`: chính sách nguồn ảnh công khai, không import dữ liệu/secret backend.
- `legacy/src/`: bản SSR để đối chiếu; API và frontend mới không import code từ legacy.

Các tài nguyên có URL công khai `/{resource}/:id`, quản trị `/admin/{resource}`, `/new`, `/:id`, `/:id/edit`, `/:id/delete`. `/dishes` là catalog; `/` là landing. Không dùng kho dữ liệu toàn cục. Mỗi trang tự fetch, hủy request cũ và có loading/error/notFound/empty phù hợp. API layer kiểm tra mạng → HTTP → body.ok. React thoát ký tự dữ liệu, không chèn HTML thô.

Form giữ dữ liệu và hiển thị fields khi lỗi; khóa gửi khi pending, chỉ nút xác nhận xóa mới DELETE. Sau ghi thành công điều hướng client đến trang đích để fetch lại. Dialog hỗ trợ Escape/focus, motion có cleanup và reduced-motion.

## Kiểm thử

```sh
npm run build
npm test
npm run test:e2e
npm run test:e2e:production
npm run test:db
```

- `npm test`: 17 ca REST API/client, seed và fallback production (fallback test cần build trước). Không còn test riêng cho SSR cũ.
- `npm run test:e2e`: Chrome có sẵn; hai server riêng ở 3100/5174, test double trong bộ nhớ; không ghi Supabase. Upload dùng storage stub, ảnh mạng bị chặn để kiểm tra fallback ổn định. Có ảnh chụp trong `artifacts/` và trace lỗi trong `test-results/`.
- `npm run test:e2e:production`: chạy cùng ca nghiệm thu với bundle build và server production có CSP/fallback. Sau lệnh này, `npm run build` tạo lại bundle với cấu hình sử dụng thực tế (`npm start` cũng tự build lại).
- `npm run test:db`: cần `TEST_DATABASE_URL`; không có thì skip rõ ràng. Tạo schema `block6_test_<uuid>`, db push chỉ vào schema đó, chạy CRUD/quan hệ/rollback/phân trang rồi drop schema trong finally. Không seed hoặc sửa public.

## Bản SSR cũ

`legacy/src/` và route EJS được giữ để đối chiếu; import và đường dẫn tài nguyên đã được cập nhật. Bộ test chuyên cho SSR đã được bỏ khi tinh gọn cho Block 6. Chạy riêng với `npm run dev:ssr`, `npm run start:ssr`, `npm run preview:ssr`. Các hướng dẫn Block 5 trong `legacy/README.block5.md` là tài liệu lịch sử; dùng lệnh SSR có hậu tố khi cần bản cũ. Không chạy đồng thời SSR/API trên cùng cổng 3000.

Chưa thêm đăng nhập/phân quyền hoặc triển khai hosting. Admin tiếp tục là chế độ demo như phạm vi bài tập.

## Kết quả nghiệm thu trước khi tinh gọn test (19/10/2026)

- `npm run build`: thành công; bundle bàn giao đã build lại với API mặc định cổng 3000.
- `npm test`: 44/44 đạt, gồm hồi quy SSR, REST API, client và fallback production.
- Playwright: 11/11 đạt trên Vite và 11/11 đạt trên server production. Kiểm tra 375/768/1440px không tràn ngang; đã xem ảnh chụp landing, catalog và form.
- Integration PostgreSQL thật: đạt CRUD, tìm kiếm trên schema mới không có trigger cũ, quan hệ, rollback, chính sách xóa và phân trang 88 món. Schema test đã drop; không seed/reset/sửa dữ liệu public.
- Khởi động độc lập từ `api/` và runner production hai ứng dụng: đạt trên cổng tạm, đã dừng sau kiểm tra.
- `npm audit` sau nâng Multer: 0 vulnerabilities; `git diff --check`: đạt.
- Upload được kiểm tra qua storage stub; không tải file mới lên bucket Supabase thật trong lượt nghiệm thu này. Chưa triển khai hosting.

## Tổ chức lại thư mục ngày 19/10/2026

- Chuyển backend/config/database/seed/import vào `api/`, tài nguyên giao diện vào `web/public/`, EJS và JavaScript SSR vào `legacy/`.
- `.env` được chuyển nguyên nội dung sang `api/.env` và vẫn bị Git bỏ qua. Backend tự nạp file này từ mọi cwd; frontend không tự nạp cấu hình backend.
- Mỗi ứng dụng có package.json riêng; npm workspaces dùng chung lockfile/cài đặt ở gốc. Các lệnh `npm run dev`, `npm start`, `npm run db:*` và `npm run *:ssr` đã trỏ sang vị trí mới.
- Seed, schema, dữ liệu backend, CSS/ảnh và JavaScript SSR đã đối chiếu nội dung với bản trước khi chuyển: giữ nguyên. Không chạy seed, db push hoặc migration vào database trong lần tổ chức này.
- Sau di chuyển: 44/44 test HTTP/unit/hồi quy và 11/11 E2E production đạt; Prisma validate/generate và build frontend thành công.
- Hai integration PostgreSQL nạp được cấu hình mới, nhưng skip trong lần này vì chưa cấu hình `TEST_DATABASE_URL`.

## Bộ test hiện tại sau khi tinh gọn

```text
tests/
├── api.test.js               # REST CRUD, lỗi, CORS, validation, transaction, ảnh
├── frontend.test.js          # API client và fallback server frontend
├── seed.test.js              # Seed không ghi đè/nhân đôi dữ liệu
├── database.integration.js   # PostgreSQL thật, tùy chọn TEST_DATABASE_URL
├── fixtures.js               # Database giả và dữ liệu nhỏ dùng chung
└── e2e/
    ├── spa.spec.js           # Các luồng người dùng trên browser
    └── server.js             # API test dùng database giả, storage stub
```

Đã giảm từ 17 xuống 7 file: bỏ các test riêng của SSR cũ, bỏ integration SSR trùng mục đích, gộp API client/fallback frontend, gộp helper và transaction fixture, thay snapshot nhà hàng lặp bằng 3 bản ghi minh họa. Seed và test seed hiện có được giữ.

E2E là end-to-end: kiểm tra một luồng hoàn chỉnh như mở trang → nhập form → gửi API → thấy kết quả. Playwright là công cụ tự động mở Chrome và thực hiện các thao tác đó. Bộ hiện tại kiểm tra CRUD bốn tài nguyên, mở thẳng/Reload URL, điều hướng không tải lại document, tìm kiếm/sắp xếp, lỗi cạnh trường và giữ dữ liệu, khóa gửi lặp, xác nhận xóa, ảnh/quan hệ, preview, request cũ và responsive 375/768/1440px.

Các test này không cần thiết để chạy website. Chỉ chạy khi muốn xác minh sau thay đổi; không tự chạy khi `npm run dev` hoặc `npm start`.

Kết quả sau tinh gọn: `npm test` đạt 17/17; Playwright production đạt 11/11. Integration database skip vì chưa cấu hình TEST_DATABASE_URL. Bundle frontend đã build lại với API mặc định cổng 3000.
