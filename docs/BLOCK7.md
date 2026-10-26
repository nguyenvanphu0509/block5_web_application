# Block 7 — Tìm kiếm và phân trang

## Đã triển khai

React SPA gọi Express API bằng AJAX, mỗi lần lấy tối đa `pageSize` món. PostgreSQL thực hiện search → filter → sort → LIMIT/OFFSET, không tải toàn bộ món để cắt trang bằng JavaScript. Server paging phù hợp collection hơn 1.000 món; ba kiểu giao diện dùng chung API.

- **Số trang:** thay danh sách; URL giữ trang và toàn bộ điều kiện khi Reload, Back/Forward hoặc mở link.
- **Tải thêm:** nối trang khi bấm nút.
- **Cuộn vô hạn:** IntersectionObserver theo dõi một sentinel cuối danh sách và nối trang tiếp.
- Hai kiểu tải tiếp mở lại link từ trang 1. Đổi điều kiện, sort, pageSize hoặc kiểu hiển thị xóa danh sách tích lũy, hủy request cũ và bỏ qua response đến muộn. Chặn request khi đang tải/hết dữ liệu; lỗi tải tiếp giữ danh sách, cho thử lại.
- Filter và sort tác động **toàn bộ tập kết quả tại server**, không chỉ các card đang hiển thị. Tên/giá và các sort theo quan hệ hiện có được giữ; mỗi thứ tự có ID để phân xử bằng nhau.

## Khởi tạo và chạy

Database đang dùng đã được nâng cấp. **Không cần seed lại để chạy website.**

```sh
npm run dev
```

Database mới: điền `api/.env`, sau đó:

```sh
npm run db:generate
npm run db:push
npm run db:seed
npm run db:migrate:block7
npm run db:seed:block7
npm run dev
```

Database hiện có chỉ cần `db:migrate:block7` rồi `db:seed:block7`. Không dùng `db:push` để thay cho migration SQL: Prisma không tạo trigger, extension hoặc GIN index tùy chỉnh. Migration idempotent có thể chạy lại, không reset database. Các migration cũ của project chưa có baseline Prisma Migrate đầy đủ, vì vậy dùng lệnh migration chuyên biệt trên thay vì `prisma migrate deploy` trực tiếp.

Seed cũ giữ snapshot 87 món; seed Block 7 bổ sung **1.000 món demo** bằng `createMany + skipDuplicates`, khóa `block7:demo:1..1000`. Không ghi đè món đã sửa, không gán quan hệ vào nhà hàng thật, không tải ảnh lên Storage. Giá/công thức/ảnh và mô tả ghi rõ demo. Script không tự chạy khi server khởi động.

`npm run db:prepare:block7` kết hợp migration, seed, seed lại và lưu bằng chứng Supabase. Đây là lệnh **có ghi database**; các món đã có được giữ nguyên. Tệp bằng chứng trước lỗi sẽ phản ánh thời điểm chạy lệnh đó.

## API

```text
GET /api/dishes?mode=advanced&q=pho&category=Món nước&minPrice=0&maxPrice=150000&available=false&page=2&pageSize=12&sort=price-asc
```

```json
{
  "ok": true,
  "data": { "items": [], "total": 0, "page": 2, "pageSize": 12 },
  "error": null,
  "meta": { "categories": [], "preview": false }
}
```

`total` đếm các món khớp cùng predicate với items. Mặc định `mode=basic`, `page=1`, `pageSize=12`; pageSize là số nguyên 1–100, page 1–1.000.000. Không có `page` cũng chỉ trả trang đầu. Trang ngoài tập kết quả hợp lệ trả items rỗng. Các API chi tiết và CRUD giữ cấu trúc cũ; riêng danh sách món đổi `data` từ array thành object. Giao diện quản trị món đã đọc `data.items` và có pager.

| Mode | So khớp | Thứ tự khi có q |
|---|---|---|
| basic | Một phần tên, ILIKE, không phân biệt hoa/thường/dấu | Sort được chọn, rồi ID |
| advanced | Basic + các điều kiện AND | Sort được chọn, rồi ID |
| fulltext | Tên + mô tả, simple trên document và websearch_to_tsquery; tên trọng số A, mô tả B | ts_rank giảm dần, ID tăng |
| fuzzy | Tên gần đúng, pg_trgm similarity ≥ 0.3 | similarity giảm dần, ID tăng |

Các filter category, minPrice, maxPrice, available, restaurantId, chefId, ingredientId, district áp dụng thống nhất trong mọi mode; Bộ lọc nâng cao là phần mở rộng bên dưới khối tìm kiếm, dùng với cả ba cách tìm. Chọn cách tìm chỉ thay đổi bản nháp và phần gợi ý; bấm Tìm kiếm mới áp dụng từ khóa, cách tìm và bộ lọc cùng lúc. Thông thường có điều kiện lọc gửi mode=advanced để tương thích API. Chỉ có cùng q thì basic/advanced cho cùng kết quả. Khi chuyển mode, bộ lọc đã áp dụng vẫn giữ trên URL. Xóa điều kiện bỏ toàn bộ filter/sort và trở về trang đầu. Nút “Sắp xếp ↗” dùng được sau khi tìm ở mọi mode, giữ từ khóa và bộ lọc, đưa về trang đầu. Với fulltext/fuzzy, sort mặc định xếp theo độ phù hợp; chọn sort khác sẽ ưu tiên thứ tự đã chọn. q trắng bỏ tiêu chí văn bản; fulltext/fuzzy lúc đó dùng sort danh sách bình thường.

`unaccent`, chuẩn hóa Unicode NFC, lower và xử lý đ được áp dụng cùng một hàm PostgreSQL cho dữ liệu/query. Basic escape `%`, `_`, `!` như ký tự thường. SQL dùng Prisma.sql để bind giá trị, chỉ sort/column từ whitelist hằng được ghép thành SQL. `false`, `0` được giữ; khoảng giá sai, số sai định dạng, mode hoặc boolean lạ trả HTTP 200 `ok:false`, mã `VALIDATION_FAILED`. Lỗi kỹ thuật dùng HTTP 4xx/5xx theo hợp đồng cũ.

Migration thêm nameSearch, searchVector; trigger BEFORE INSERT/UPDATE OF name, description làm mới index, kể cả sửa trực tiếp trong Supabase. Trường mô tả NULL được coalesce. GIN tsvector phục vụ full-text; GIN trigram phục vụ tìm tên. Fuzzy dùng similarity với ngưỡng tường minh, không phụ thuộc cấu hình session. Planner có thể chọn sequential scan ở tập dữ liệu nhỏ; không ép index để tạo bằng chứng giả.

## Kiểm thử tập trung

```sh
npm run build
npm run test:block7
npm run test:e2e:block7
```

Chỉ một nhóm PostgreSQL và năm luồng Playwright. Test kết nối TEST_DATABASE_URL nếu có, nếu không dùng DATABASE_URL nhưng **tạo schema block7_test_<uuid> riêng**, xác nhận current_schema rồi xóa schema khi xong; không reset public. Extension được cài vào public nếu chưa có, không nằm trong schema test bị dọn.

- PostgreSQL: bốn mode, tìm không dấu, từ chỉ có trong mô tả, fuzzy lỗi gõ, `%/_/!`, false/0, validation, total và hai trang không trùng, trang vượt phạm vi, CRUD cập nhật search, seed chạy hai lần giữ chỉnh sửa.
- Số trang: advanced + sort giá → trang 2 → Reload vẫn đúng URL/kết quả.
- Sắp xếp sau tìm toàn văn/gần đúng: đổi giá tăng/giảm, giữ từ khóa và bộ lọc, trở về trang đầu.
- Tải thêm: 12 → 24 món khác nhau; response cũ đang chờ không ghi đè lần tìm mới.
- Cuộn vô hạn: 12 → 24 → 25 món, dừng khi hết; xóa điều kiện về trang đầu.

Playwright dùng Chrome đã cài; ghi video cần `npx playwright install ffmpeg`. Bộ fixture SQL cũ chỉ mô phỏng hợp đồng basic; full-text/fuzzy và SQL thật được kiểm tra trong nhóm PostgreSQL, không giả lập thuật toán PostgreSQL bằng JavaScript.

## Bằng chứng nộp

Các tệp nằm trong `artifacts/block7/` (thư mục artifacts được gitignore sẵn; nộp kèm riêng nếu nộp qua Git):

- `supabase-verification.json`: nguồn Supabase thật, COUNT public.dishes, count seed trước/sau, extension, request/response, SQL có bind parameter và EXPLAIN ANALYZE.
- `supabase-count.png`: ảnh báo cáo COUNT được tạo từ kết quả SQL Supabase, **không phải ảnh dashboard Supabase**.
- `postgres-test.json`: kết quả nhóm test trên schema riêng, hai trang khác nhau, seed lặp, SQL và EXPLAIN.
- `01-pages`, `02-more`, `03-infinite`: ảnh `.png`, video `.webm`, bản ghi response `-network.json` từ ba luồng trình duyệt dùng PostgreSQL schema riêng.
- `demo-pagination.webm`: video ghép ba luồng để trình bày ba kiểu phân trang.

Network JSON có URL, HTTP status và body thực; chứng minh request chỉ trả tối đa 12 món, không tải 1.000 món về browser. Các video UI dùng 25 món kiểm thử riêng để thấy được điểm dừng; số lượng 1.089 món trên database chính được chứng minh độc lập qua SQL. Không gộp hai nguồn bằng chứng thành cùng một tập dữ liệu.

### Lỗi phát hiện và sửa

Trước sửa, listRecords gọi model.count() không có điều kiện và trả meta.total bằng toàn collection. Khi tìm `pho` trên 89 món cũ: **meta.count=14 nhưng meta.total=89**. Bản ghi `before` tái hiện thuật toán listRecords cũ trên dữ liệu Supabase thật trước seed, không phải ảnh chụp ứng dụng cũ đang chạy.

Sau sửa và thêm 1.000 món demo: tìm cùng từ khóa trả **data.total=114**, toàn collection **1.089**; trang 1 và 2 có tối đa 12 món/trang, total đều 114. Count và items dùng chung predicate SQL nên total phản ánh tập kết quả. Test PostgreSQL có fixture riêng với q=pho, total=2 và hai trang mỗi trang một ID khác nhau, chứng minh độc lập với việc tăng dữ liệu.

Để lấy thêm ảnh dashboard khi nộp: mở Supabase SQL Editor của database đang dùng và chạy:

```sql
SELECT count(*) AS total,
       count(*) FILTER (WHERE "importKey" LIKE 'block7:demo:%') AS demo
FROM public.dishes;
```

Kết quả nghiệm thu lần triển khai: **total=1089, demo=1000**, seed lần hai inserted=0. Chưa có phiên dashboard Supabase truy cập được trong công cụ nên ảnh bằng chứng count được tạo từ truy vấn SQL trực tiếp; có thể bổ sung ảnh SQL Editor bằng truy vấn trên.

## Toàn văn theo hướng dẫn Supabase

Tham khảo: https://supabase.com/docs/guides/database/full-text-search

Ô tìm toàn văn dùng `websearch_to_tsquery('simple', block7_normalize(q))` và so khớp `searchVector @@ query`. Ví dụ:

- `phở bò`: có đủ hai từ, không bắt buộc liền nhau.
- `"phở bò"`: cụm từ liền nhau, đúng thứ tự.
- `phở OR bún`: có một trong hai từ.
- `phở -gà`: có phở, loại kết quả có gà.

Giữ cấu hình `simple` phù hợp dữ liệu tiếng Việt và hỗ trợ không dấu; không áp dụng stemming tiếng Anh. Đây là cú pháp web search; các toán tử SQL thô như `&`, `|`, `:*` không phải cú pháp của ô này.

`setweight(to_tsvector(...name...), 'A') || setweight(to_tsvector(...description...), 'B')` ưu tiên khớp tên khi sort mặc định, dùng `ts_rank`. Sort do người dùng chọn vẫn được ưu tiên. GIN index hiện có tiếp tục phục vụ tìm kiếm. Trigger cập nhật vector tự động khi tên/mô tả đổi; dùng trigger vì hàm bỏ dấu `unaccent` không immutable để đưa trực tiếp vào generated column. Mô tả NULL được xử lý bằng coalesce.

Chạy `npm run db:migrate:block7` để áp dụng cả migration nền và migration trọng số mới cho dữ liệu hiện có, không cần seed lại. API vẫn dùng Prisma bind parameters, cùng bộ lọc cho count/items và phân trang ở PostgreSQL.

### Câu tìm món tự nhiên (chỉ mode=fulltext)

Trước khi tạo websearch query, API bỏ các câu dẫn phổ biến như “nay tôi muốn ăn”, “hôm nay mình thèm ăn”, “tìm giúp tôi món”, và lời kết “nhé”, “nha”, “với” khi đã nhận diện câu dẫn. Ví dụ `nay toi muon an pho bo` tìm bằng `pho bo`. Giữ nguyên q trên URL và ô nhập; count/items/ranking cùng dùng từ khóa đã xử lý.

Đây là quy tắc nhận diện câu dẫn phổ biến, không phải mô hình hiểu ngôn ngữ tự do. Không bỏ từ riêng lẻ trên toàn câu để tránh mất từ trong tên/nguyên liệu như bò, tỏi. Giữ cú pháp ngoặc kép, OR và dấu trừ; câu không có từ khóa không trở thành danh sách tất cả món. Basic/advanced/fuzzy giữ nguyên xử lý cũ. Không cần migration hay seed.
