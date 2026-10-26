> Tài liệu và ghi chú trước khi tổ chức lại thư mục. Một số đường dẫn/lệnh bên dưới là lịch sử; dùng README gốc và docs/BLOCK6.md cho cấu trúc hiện tại.

# Block 6 — REST API + React SPA

Ứng dụng hiện dùng API ở `http://localhost:3000` và React SPA ở `http://localhost:5173`. Chạy `npm ci`, `npm run db:generate`, rồi `npm run dev`. Production: `npm start` tự build và chạy hai ứng dụng. Giữ nguyên database, không cần seed/reset.

Xem [hướng dẫn Block 6](docs/BLOCK6.md) cho API contract, cấu hình, validation và kiểm thử. Bản EJS cũ vẫn chạy qua `npm run dev:ssr` / `npm run start:ssr`; phần Block 5 bên dưới được giữ làm tài liệu tham khảo.

# note
fetch và AJAX là hai khái niệm trong lập trình web, dùng để gửi yêu cầu HTTP từ JavaScript phía client (trình duyệt) đến server và nhận dữ liệu về mà không cần tải lại toàn bộ trang web.
Tuy nhiên, chúng không hoàn toàn giống nhau:
- AJAX là một kỹ thuật giao tiếp bất đồng bộ giữa trình duyệt và server.
- fetch() là một API có sẵn trong JavaScript, thường được dùng để thực hiện AJAX.

| Lệnh | Tác dụng |
|---|---|
| `npm run db:generate` | Sinh Prisma Client để code JavaScript truy vấn database |
| `npm run db:push` | Đồng bộ cấu trúc bảng từ `schema.prisma` lên database |
| `npm run db:seed` | Chạy `prisma/seed.js` để thêm dữ liệu mẫu vào các bảng |

# Block5 Kitchen

Ứng dụng SSR khám phá ẩm thực Sài Gòn và quản trị món ăn, đầu bếp, nguyên liệu. Express + EJS render HTML trên server. Tìm kiếm, phân trang và đổi tab dùng form/link GET tải lại trang; không dùng fetch/AJAX phía trình duyệt. JavaScript chỉ hỗ trợ popup, xem trước ảnh và thao tác giao diện.

## Chạy ngay bản xem trước

Yêu cầu Node.js 24.x và npm.

```sh
npm ci
npm run db:generate
npm run preview
```

Mở http://localhost:3000. Preview **chỉ đọc**, có nhãn trên mọi trang; form lưu/xóa bị khóa và request ghi trả 503. Preview vẫn đọc Supabase và cần DATABASE_URL. Không còn catalog local dự phòng.

## Kết nối Supabase thật

Project nhóm: `block5-dev`, ref `ewreqsqfiubjmrnynkzv`.

1. Trong Supabase: **Connect → Connection string → Session pooler**, port **5432**. Sao chép chuỗi kết nối và thay mật khẩu đúng của database. Percent-encode ký tự đặc biệt trong mật khẩu.
2. Nếu chưa có `.env`, sao chép `.env.example` thành `.env`. Điền `DATABASE_URL` trên máy, giữ `PREVIEW_MODE=false`. Không gửi chuỗi kết nối vào chat hoặc Git.
3. Chạy các lệnh trong thư mục dự án:

```sh
npm run db:check
npm run db:generate
npm run db:migrate:catalog
npm start
```

`db:check` chỉ đọc `SELECT 1`. Với database hiện tại, `db:migrate:catalog` áp dụng migration SQL có backup và trigger tìm kiếm; chạy lại không tạo món trùng. Database mới cần `db:push` tạo bảng gốc trước khi chạy migration. `db:push` riêng không cài các trigger tìm kiếm. Không thêm `--force-reset` hoặc `--accept-data-loss`. Mỗi lần sửa model, xem lại thay đổi trước khi chạy trên database nhóm.

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

Catalog trong schema `public` có quan hệ quán–món qua `Dish.restaurantId`; xóa quán đặt liên kết món thành null, giữ món. Không đặt unique cho tên:

| Model / bảng | Cột |
| --- | --- |
| Restaurant / restaurants | id; name; address; ward; district; cuisine; notableDishes; imagePath; khoảng giá quán; michelinUrl unique; searchText; verifiedAt |
| Story / stories | id; name; location; initials; text (nhận xét minh họa) |
| RestaurantImportArchive / restaurant_import_archive | legacyId; record JSONB; archivedAt (backup 36 bản ghi trước khi chuyển) |
| Dish / dishes | id Int PK tự tăng; name String; description String nullable; price Int nullable; restaurantId FK; importKey unique; searchText; category String nullable; available Boolean default true; imagePath String nullable; createdAt DateTime default now |
| Chef / chefs | id Int PK tự tăng; name String; specialty String nullable; createdAt DateTime default now |
| Ingredient / ingredients | id Int PK tự tăng; name String; unit String; createdAt DateTime default now |

Giá là số nguyên VND. Model trong `prisma/schema.prisma` là nguồn schema. Không thay đổi các schema hệ thống Supabase (`auth`, `storage`, `realtime`, `vault`). `prisma/seed.js` chứa toàn bộ snapshot đọc từ Supabase ngày 13/10/2026: **87 món, 39 nhà hàng, 13 đầu bếp, 44 nguyên liệu, 248 liên kết món–nguyên liệu, 6 câu chuyện và 36 bản ghi lưu trữ import**. Đây là một file duy nhất chứa cả dữ liệu và logic seed, không cần chạy các script import rời. Giữ nguyên ID, các cột, thời gian tạo và quan hệ; chèn bảng cha trước bảng con và cập nhật sequence để thao tác thêm sau seed không trùng ID. Upsert giữ nguyên bản ghi cùng ID, không xóa hoặc ghi đè. Nếu ID/tên hoặc khóa duy nhất xung đột, seed dừng. Hãy dùng **database mới của thầy**, không chạy để cập nhật database nhóm.

Với **database mới**, chạy:

```sh
npm run db:generate
npm run db:push
npm run db:seed
npm start
```

`npm run db:seed` tương đương `npx prisma db seed`. Lệnh tái tạo dữ liệu hiện tại vào database mới trong `.env`. **Kiểm tra `DATABASE_URL` trỏ đúng database dùng chấm bài trước khi chạy.** Database nhóm đã có dữ liệu nên không cần seed lại. Không tự chạy seed khi khởi động server. Seed không tạo bucket hoặc tải file ảnh: ảnh URL vẫn cần Internet và bucket Supabase hiện tại; ảnh local đi kèm `public/images/`. Những dữ liệu giá/công thức/đầu bếp được đánh dấu demo vẫn giữ nguyên nhãn. Snapshot là dữ liệu tại thời điểm xuất, không tự đồng bộ những thay đổi Supabase sau này.


## Routes và request contract

| Method | URL | Hành vi |
| --- | --- | --- |
| GET | / | Landing, catalog và cảm hứng |
| GET | /dishes?q=... | Tìm món theo tên và loại, hỗ trợ không dấu |
| GET | /restaurants/:id | Quán, địa chỉ và các món liên kết |
| GET | /api/restaurants/suggestions?q=... | Tối đa 6 gợi ý từ Supabase |
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

`{resource}` là bốn router cố định: `restaurants`, `dishes`, `chefs`, `ingredients`.

Form thêm POST; form sửa POST tới `?_method=PATCH`; form xóa POST tới `?_method=DELETE`. Browser vẫn gửi POST, middleware đổi method để khớp router. Override không áp dụng cho GET. Thêm/sửa thành công trả **303** tới chi tiết; xóa trả **303** về danh sách. Tất cả ghi dữ liệu đều await trước redirect.

Trang chủ nhận `destinationQ`, `destinationPage` (6 nhà hàng/trang), `reviewTab=text|gallery`, `reviewPage` (3 nhân vật/trang). Phân trang và toggle là GET; giữ query các phần khác và anchor. Query sai kiểu/giá trị trả 400; trang hợp lệ vượt giới hạn hiển thị empty state.

## Validation và lỗi

- Tên bắt buộc, trim, tối đa 120 ký tự; không unique.
- Mô tả 2.000 ký tự; loại món 80; chuyên môn 120; đơn vị bắt buộc, tối đa 30.
- Giá nguyên 0–2.147.483.647, hoặc chọn “Giá chưa xác nhận” để lưu null và hiển thị “Hỏi quán”; không lấy giá quán làm giá món.
- Checkbox có giá trị `true`; vắng mặt thành false.
- Ảnh nhận SVG local, URL Michelin hoặc ảnh tải lên Supabase Storage.
- Field text/query chỉ nhận chuỗi đơn; array/object bị từ chối. Query tìm kiếm tối đa 120 ký tự.
- Input sai: **400**, giữ giá trị đã nhập và lỗi theo field, không ghi database.
- ID sai/không có hoặc bản ghi vừa bị xóa: **404**.
- Lỗi database: **500**, thông báo chung; log chỉ method/path/error code, không log secret hay err.message.
- Preview ghi dữ liệu: **503**; origin khác APP_ORIGIN trên request ghi: **403**.

Prisma dùng truy vấn có tham số. Không truyền nguyên req.body vào create/update; không nối input vào SQL. Dữ liệu EJS escape bằng `<%= %>`; `<%- %>` chỉ include partial của ứng dụng. CSP chặn script; form body tối đa 32KB; `.env` gitignore. Kiểm tra Origin khi có header, không thay thế authentication/CSRF protection của ứng dụng production.

PRG ngăn Reload gửi lại thao tác ghi đã redirect; **không ngăn hai lần submit đồng thời**. Bài tập chưa có account/session, giỏ hàng, đặt bàn, thanh toán hoặc booking. Không publish admin này lên Internet trước khi bổ sung xác thực và quyền truy cập.

## Dữ liệu và ảnh

Danh sách quán, món và review được đọc qua Prisma → Supabase. Catalog JSON cũ không còn được sử dụng và đã được loại bỏ. Migration chuyển 36 bản ghi có sẵn trong Supabase sang Restaurant, sao lưu bản gốc và giữ món người dùng. Địa chỉ và 68 món liên kết được đối chiếu hồ sơ Michelin; xem `docs/restaurant-provenance.md`. Quán chưa có món cụ thể được xác nhận giữ danh sách món trống.

Tìm quán hỗ trợ không dấu/đ, tên, địa chỉ, quận (cách gọi quen thuộc), loại ẩm thực và tên món liên kết. Trigger PostgreSQL tự cập nhật searchText khi quán hoặc món thay đổi, kể cả sửa trực tiếp trong Supabase. Nhập hiện gợi ý sau 200 ms; chọn gợi ý hoặc nút Phở/Bún/Món chay sẽ tìm tại chỗ qua luồng AJAX có sẵn. Trang món ăn tìm theo tên/loại món.

- Giá min=0: “Dưới …”; max=null: “Từ …”.
- Ảnh Michelin dùng URL lưu trong database và giữ link nguồn. Ảnh là ảnh trong hồ sơ nhà hàng, nhãn lấy từ photo_type; không bảo đảm tên món cụ thể.
- Ảnh cảnh quan và showcase là placeholder Unsplash, URL cố định trong EJS. Không đại diện cho cảnh Sài Gòn hay món thật của dự án. Dịch vụ ảnh có thể thay đổi/không truy cập; nền SVG local làm fallback.
- SVG món và phong cảnh local là minh họa tự tạo; ảnh món không phải ảnh chụp thực tế.
- Nhân vật/review hư cấu, ghi rõ minh họa. Không có nút play/video giả.

## Kiểm thử

```sh
npm test
```

HTTP tests dùng test double **riêng, không phải Supabase**: kiểm tra landing, GET tìm kiếm/phân trang, CRUD và liên kết quán–món, override, PRG, validation, XSS, 400/403/404/500/503, giới hạn body và preview. Không xem bộ test này là bằng chứng đã ghi database thật.

Integration thật (tùy chọn): đặt `TEST_DATABASE_URL` trong `.env` tới database test có quyền tạo schema rồi chạy:

```sh
npm run test:db
```

Test tạo schema `block5_test_<uuid>` riêng, `db push` vào đó, kiểm tra CRUD qua Prisma và phân trang/quan hệ, rồi xóa **chỉ schema test mới tạo**. Không dùng schema public. Nếu không có TEST_DATABASE_URL, test hiển thị skip. Không chạy integration trên môi trường production.

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

Mời mỗi thành viên vào organization Supabase bằng tài khoản riêng. Chia sẻ code/schema/lockfile qua Git; mỗi người tự cấu hình `.env` tới project chung. Thống nhất một người chạy thay đổi schema và seed, xem diff trước khi db push. Không sửa bảng thủ công rồi để Prisma schema lệch database. Khi cần lịch sử thay đổi cho production, chuyển sang migration workflow riêng; db push ở đây theo yêu cầu bài tập. Riêng catalog dùng SQL migration versioned ở `prisma/migrations/20261012_restaurant_catalog`, chạy bằng `db:migrate:catalog`; không chạy `prisma migrate deploy` trực tiếp trên database có sẵn chưa baseline.

## Trạng thái bàn giao

Ứng dụng kết nối Supabase thật qua Session pooler 5432. Cập nhật ngày 13/10/2026: 87 món, 39 quán (3 quán demo), 13 đầu bếp, 44 nguyên liệu (theo snapshot seed). Trang món ăn có phân trang 12 món/trang và bộ lọc nhà hàng/khu vực/loại món/đầu bếp/nguyên liệu. Giá và công thức bổ sung được đánh dấu demo. `.env` chỉ lưu trên máy. Chạy `npm start` để dùng database thật; `npm run preview` vẫn chỉ đọc. Xem [CATALOG_UPDATE.md](CATALOG_UPDATE.md) cho quy tắc bổ sung, khóa ngoại và lệnh migration; xem `VERIFICATION.md` cho kiểm thử.
# Popup sắp xếp và ảnh nhà hàng

Nút “Tất cả món ăn ↗” mở popup chỉ chứa lựa chọn sắp xếp; thanh “Tìm món ăn” nằm trực tiếp trên trang. 39 quán đã dùng ảnh không gian riêng (36 quán thật, 3 quán demo có nhãn minh họa), kèm link nguồn. Xem [RESTAURANT_IMAGES.md](RESTAURANT_IMAGES.md) cho danh mục ảnh và lệnh cập nhật lại. Khởi động lại server đang chạy sau khi cập nhật code/danh mục nguồn ảnh.

## Dữ liệu giữ lại

`data/` chỉ giữ các file có code hoặc script sử dụng:

- `demo.js`: dữ liệu preview, ảnh local và fixtures kiểm thử; seed đầy đủ nằm trong `prisma/seed.js`.
- `catalog-enrichment.js`: công thức demo cho script bổ sung catalog.
- `user-image-dishes.json`: nguồn của script nhập 24 món.
- `dish-image-replacements.json`: script cập nhật ảnh món và kiểm thử nguồn ảnh.
- `restaurant-space-images.json`: ảnh không gian, nguồn ảnh và CSP.

Hồ sơ đối chiếu nhà hàng nằm trong `docs/restaurant-provenance.md`. Đã bỏ catalog Michelin JSON không còn dùng và bản báo cáo ảnh cũ; dữ liệu Supabase không bị xóa.
##
Multer là một middleware trong Node.js, thường được dùng với Express.js, có nhiệm vụ xử lý việc upload file từ client lên server.

block6/
├── api/          Backend REST API
├── web/          Frontend React
├── shared/       Validation và định nghĩa dùng chung
├── prisma/       Schema, migration, seed
├── data/         Dữ liệu và nguồn ảnh
├── public/       CSS, ảnh và tài nguyên hiện có
├── src/          Bản SSR cũ và helper được tái sử dụng
├── tests/        Kiểm thử
└── scripts/      Lệnh chạy và công cụ hỗ trợ

backend
npm run dev:api (
    http://localhost:3000/api/config
http://localhost:3000/api/dishes?page=1
)
frontend
npm run dev:web
(Frontend được cấu hình trong vite.config.js.

Frontend gọi backend thông qua api.js:
http://localhost:3000/api/...
GET http://localhost:3000/api/dishes?page=1
GET http://localhost:3000/api/config)

ca 2 chay cung luc: npm run dev

Danh sách món: /api/dishes
Chi tiết món: /api/dishes/:id
Nhà hàng: /api/restaurants
Đầu bếp: /api/chefs
Cấu hình: /api/config


Backend REST API
- Tạo api/ với Express.
- Đủ 20 endpoint CRUD cho món ăn, đầu bếp, nguyên liệu và nhà hàng.
- Thêm API landing page, gợi ý nhà hàng và cấu hình công khai.
- Response và phân biệt lỗi nghiệp vụ/kỹ thuật theo đúng đề.
- CORS cho đúng origin, hỗ trợ preflight.

Validation và bảo toàn dữ liệu
- Kiểm tra kiểu dữ liệu JSON, ID, giá, boolean, chuỗi và quan hệ.
- PATCH chỉ cập nhật trường được gửi.
- Chặn ghi các trường ngoài danh sách cho phép.
- Transaction khi lưu món cùng quan hệ mới.
- Giữ chính sách xóa và chế độ preview chỉ đọc.

Frontend React SPA
- Tạo web/ dùng React, Vite và React Router.
- Chuyển landing page, catalog, chi tiết và quản trị sang React.
- Có form thêm/sửa, trang xác nhận xóa.
- Tìm kiếm, lọc, phân trang và sắp xếp đồng bộ URL.
- Loading, danh sách rỗng, không tìm thấy, lỗi và thử lại.
- Điều hướng không tải lại document; giữ dữ liệu form khi lỗi.

Ảnh và giao diện
- Tái sử dụng CSS, ảnh và bố cục hiện có.
- Form URL/upload, xem trước ảnh, giữ ảnh cũ khi chưa thay.
- Validation loại file và giới hạn 5 MB.
- Motion có cleanup, hỗ trợ reduced-motion.
- Kiểm tra responsive 375/768/1440px.


| Method | URL | Nội dung trả về |
|---|---|---|
| GET | [/api/home](http://localhost:3000/api/home) | Dữ liệu trang chủ: món nổi bật, danh sách nhà hàng theo trang, nhận xét minh họa, ảnh và thông tin phân trang |
| GET | [/api/config](http://localhost:3000/api/config) | Cấu hình công khai: chế độ chỉ đọc, lựa chọn ảnh, nguồn ảnh được phép, các kiểu sắp xếp |
| GET | [/api/restaurants/suggestions?q=pho](http://localhost:3000/api/restaurants/suggestions?q=pho) | Tối đa 6 gợi ý nhà hàng phù hợp từ khóa |
| GET | [/api/dishes](http://localhost:3000/api/dishes) | Danh sách món ăn, kèm nhà hàng và đầu bếp liên quan |
| GET | [/api/dishes/1](http://localhost:3000/api/dishes/1) | Chi tiết món số 1, gồm nhà hàng, đầu bếp và nguyên liệu |
| GET | [/api/chefs](http://localhost:3000/api/chefs) | Danh sách đầu bếp |
| GET | [/api/chefs/1](http://localhost:3000/api/chefs/1) | Chi tiết đầu bếp số 1 |
| GET | [/api/ingredients](http://localhost:3000/api/ingredients) | Danh sách nguyên liệu |
| GET | [/api/ingredients/1](http://localhost:3000/api/ingredients/1) | Chi tiết nguyên liệu số 1 |
| GET | [/api/restaurants](http://localhost:3000/api/restaurants) | Danh sách nhà hàng, kèm món liên kết và thông tin nguồn ảnh |
| GET | [/api/restaurants/1](http://localhost:3000/api/restaurants/1) | Chi tiết nhà hàng số 1 và các món tại nhà hàng đó |

| URL giao diện | Nội dung | API chính được gọi |
|---|---|---|
| [Trang chủ](http://localhost:5173/) | Món nổi bật, khám phá nhà hàng, cảm hứng | `GET /api/home` |
| [Danh sách món](http://localhost:5173/dishes) | Tìm kiếm, sắp xếp, phân trang món | `GET /api/dishes?page=1` |
| [Chi tiết món số 1](http://localhost:5173/dishes/1) | Thông tin món, đầu bếp, nguyên liệu, nhà hàng | `GET /api/dishes/1` |
| [Nhà hàng số 1](http://localhost:5173/restaurants/1) | Thông tin nhà hàng và thực đơn | `GET /api/restaurants/1` |
| [Đầu bếp số 1](http://localhost:5173/chefs/1) | Thông tin đầu bếp, link xem món liên quan | `GET /api/chefs/1` |
| [Nguyên liệu số 1](http://localhost:5173/ingredients/1) | Thông tin nguyên liệu, link xem món liên quan | `GET /api/ingredients/1` |


| URL | Quản lý |
|---|---|
| [/admin/dishes](http://localhost:5173/admin/dishes) | Món ăn |
| [/admin/chefs](http://localhost:5173/admin/chefs) | Đầu bếp |
| [/admin/ingredients](http://localhost:5173/admin/ingredients) | Nguyên liệu |
| [/admin/restaurants](http://localhost:5173/admin/restaurants) | Nhà hàng |

| Đường dẫn frontend | Nội dung | API được gọi |
|---|---|---|
| `/admin/{resource}` | Bảng danh sách | GET danh sách |
| `/admin/{resource}/new` | Form thêm | POST khi gửi form |
| `/admin/{resource}/:id` | Chi tiết quản trị | GET chi tiết |
| `/admin/{resource}/:id/edit` | Form sửa, nạp dữ liệu hiện có | GET chi tiết; PATCH khi lưu |
| `/admin/{resource}/:id/delete` | Trang xác nhận xóa | GET chi tiết; DELETE khi xác nhận |