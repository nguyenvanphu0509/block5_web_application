# Quy trình cấu hình và đẩy dữ liệu lên Supabase

Tài liệu này ghi lại quy trình từ mục 3 trở đi: cấu hình kết nối Supabase, tạo schema, chạy migration, nạp dữ liệu và vận hành ứng dụng.

Migration: thay đổi cấu trúc database, như tạo bảng hoặc thêm cột.
Seed: thêm dữ liệu mẫu, như các món ăn và URL ảnh.

Kiểm tra URL hiện tại trên Supabase, chưa ghi dữ liệu:
node scripts/update-dish-images.js --check
3. Cập nhật URL mới vào database thật:
node scripts/update-dish-images.js --apply

CSP = Content Security Policy → Chính sách bảo mật nội dung.
Đây là một cơ chế bảo mật của trình duyệt, giúp website kiểm soát những nguồn nào được phép tải nội dung, chẳng hạn như hình ảnh, JavaScript, CSS, font và các tài nguyên khác.
## 3. Cấu hình kết nối Supabase

Ứng dụng kết nối trực tiếp tới PostgreSQL của Supabase qua biến `DATABASE_URL`.

Tạo file môi trường từ file mẫu:

```bash
cp .env.example .env
```

Trong Supabase Dashboard, lấy chuỗi kết nối tại:

```text
Connect → Connection string → Session pooler
```

Project này dùng Session pooler với port `5432`. Giá trị trong `.env` có dạng:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres"
```

Nếu mật khẩu có ký tự đặc biệt, phải URL-encode trước khi đưa vào URL kết nối:

```text
@ → %40
# → %23
/ → %2F
: → %3A
```

Không dùng Supabase API URL hoặc publishable key thay cho `DATABASE_URL`.

Ứng dụng upload ảnh qua Supabase Storage. Cấu hình tương ứng:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_STORAGE_BUCKET=dish-images
```

Tạo bucket `dish-images` trong:

```text
Supabase Dashboard → Storage → New bucket
```

Service role key chỉ được dùng ở server, không đưa vào frontend, không commit vào Git và không gửi qua chat.

## 4. Kiểm tra kết nối và tạo Prisma Client

Sau khi điền `.env`, kiểm tra kết nối:

```bash
npm run db:check
```

Lệnh này chỉ chạy `SELECT 1`, không tạo hoặc sửa dữ liệu.

Tiếp theo sinh Prisma Client từ `prisma/schema.prisma`:

```bash
npm run db:generate
```

`db:generate` chỉ sinh mã client để ứng dụng gọi database; lệnh này không tạo bảng.

## 5. Tạo schema trên Supabase

Với database Supabase mới, đồng bộ các model Prisma thành bảng PostgreSQL:

```bash
npm run db:push
```

Các bảng chính gồm:

```text
dishes
restaurants
stories
restaurant_import_archive
chefs
ingredients
```

Quan hệ chính:

```text
dishes.restaurantId → restaurants.id
```

Khi restaurant bị xóa, `restaurantId` của các món liên quan được đặt thành `NULL` nhờ `onDelete: SetNull`.

`db:push` chỉ đồng bộ schema trong `prisma/schema.prisma`. Nó không tự chạy các trigger, hàm chuẩn hóa tìm kiếm, bước backup hoặc logic chuyển catalog trong migration SQL.

## 6. Chạy migration catalog

Sau khi tạo schema gốc, chạy:

```bash
npm run db:migrate:catalog
```

Script `scripts/migrate-restaurants.js` đọc và chạy:

```text
prisma/migrations/20261012_restaurant_catalog/migration.sql
```

Migration này:

1. Tạo bảng restaurant, story và bảng archive nếu chưa có.
2. Bổ sung cột, khóa ngoại và index cho `dishes`.
3. Backup các bản ghi restaurant cũ vào `restaurant_import_archive`.
4. Chuyển dữ liệu restaurant cũ sang `restaurants`.
5. Xóa bản ghi cũ khỏi `dishes` sau khi đã archive.
6. Tạo hàm chuẩn hóa chuỗi tìm kiếm không dấu.
7. Tạo trigger cập nhật `searchText` cho restaurant và dish.
8. Tạo trigger làm mới chỉ mục tìm kiếm restaurant khi món liên quan thay đổi.
9. Cập nhật địa chỉ, khu vực, món nổi bật và thời điểm xác minh.
10. Thêm các story minh họa nếu chưa tồn tại.

Script có thể chạy lại an toàn hơn nhờ `IF NOT EXISTS` và `ON CONFLICT`, nhưng vẫn cần kiểm tra dữ liệu trước khi chạy trên database dùng chung.

## 7. Quy trình đầy đủ cho database mới

Chạy các lệnh theo thứ tự:

```bash
npm ci
npm run db:check
npm run db:generate
npm run db:push
npm run db:migrate:catalog
npm start
```

Mở ứng dụng tại:

```text
http://localhost:3000
```

Trang quản trị:

```text
http://localhost:3000/admin
```

## 8. Đẩy dữ liệu lên Supabase

### 8.1. Qua trang quản trị

Chạy:

```bash
npm start
```

Sau đó dùng các form trong `/admin`.

Luồng lưu dữ liệu:

```text
Form HTML
→ Express route
→ Controller
→ Validation
→ Prisma
→ Supabase PostgreSQL
```

Ảnh upload được giữ tạm trong memory bằng Multer, upload lên Supabase Storage, sau đó URL public được lưu vào `dishes.imagePath`.

### 8.2. Qua script migration

Catalog restaurant được đưa vào database bằng:

```bash
npm run db:migrate:catalog
```

Script này dùng thư viện `pg` để chạy SQL trực tiếp, phù hợp với các thao tác tạo trigger, archive và chuyển đổi dữ liệu.

### 8.3. Dữ liệu demo

Trước đây project có `prisma/seed.js` và lệnh `npm run db:seed` để tạo 12 món, 4 đầu bếp và 10 nguyên liệu demo. File seed đã được xóa, nên dữ liệu mới cần được nhập qua trang quản trị hoặc script import/migration phù hợp.

## 9. Ảnh và Supabase Storage

Ảnh món ăn không lưu trực tiếp trong PostgreSQL. File được upload lên bucket Storage:

```text
dish-images
```

Database chỉ lưu URL trong:

```text
dishes.imagePath
```

Luồng upload:

```text
Chọn file
→ Multer giữ file trong memory
→ Upload lên Supabase Storage
→ Nhận public URL
→ Lưu URL vào dishes.imagePath
```

Ảnh local mặc định vẫn nằm trong `public/images/`; chúng không tự động được đưa lên Supabase Storage.

## 10. Kiểm tra dữ liệu sau khi push

Trong Supabase SQL Editor có thể chạy:

```sql
SELECT COUNT(*) FROM public.dishes;
SELECT COUNT(*) FROM public.restaurants;
SELECT COUNT(*) FROM public.stories;
SELECT COUNT(*) FROM public.chefs;
SELECT COUNT(*) FROM public.ingredients;
```

Kiểm tra quan hệ món và restaurant:

```sql
SELECT
  d.id,
  d.name AS dish_name,
  r.name AS restaurant_name
FROM public.dishes d
LEFT JOIN public.restaurants r
  ON d."restaurantId" = r.id
ORDER BY d.id;
```

Kiểm tra chỉ mục tìm kiếm:

```sql
SELECT id, name, "searchText"
FROM public.restaurants
ORDER BY id
LIMIT 10;
```

## 11. Khi thay đổi schema

1. Sửa model trong `prisma/schema.prisma`.
2. Chạy `npm run db:generate`.
3. Xem kỹ thay đổi schema.
4. Chạy `npm run db:push` trên database phù hợp.
5. Cập nhật validator, controller, form, view và test nếu có field mới.
6. Chạy `npm run db:check` và `npm test`.

Không dùng các tùy chọn có thể reset hoặc làm mất dữ liệu trên database dùng chung:

```text
--force-reset
--accept-data-loss
```

## 12. Các lệnh quan trọng

| Lệnh | Tác dụng |
| --- | --- |
| `npm run db:check` | Kiểm tra kết nối PostgreSQL |
| `npm run db:generate` | Sinh Prisma Client |
| `npm run db:push` | Đồng bộ model Prisma thành bảng |
| `npm run db:migrate:catalog` | Chạy migration catalog, archive và trigger |
| `npm start` | Chạy ứng dụng với database |
| `npm run preview` | Chạy ứng dụng ở chế độ chỉ đọc |
| `npm test` | Chạy test HTTP và ứng dụng |

## 13. Lưu ý bảo mật

Không commit hoặc chia sẻ các giá trị thật sau:

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

File `.env` phải nằm ngoài Git. Chỉ commit `.env.example` với giá trị mẫu.
