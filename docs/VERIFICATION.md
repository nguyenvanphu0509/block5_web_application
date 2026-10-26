# Kiểm tra bàn giao — 12/10/2026

## Đã chạy

- Cài dependency và lưu package-lock; Node.js 24.21.0.
- `npm run db:generate`: Prisma Client 7.10.0 generate thành công từ ba model.
- `npm test`: 9/9 nhóm test HTTP đạt; sử dụng test double độc lập, không ghi Supabase.
- npm audit sau override dependency: 0 vulnerabilities theo kết quả cài đặt.
- Preview local tại http://localhost:3000: trang chủ, danh sách món, bảng quản trị và form thêm render được.
- Browser 375px, 768px, 1440px: document scrollWidth bằng viewport, catalog chuyển 1/2/3 cột; bảng quản trị cuộn riêng trên mobile.
- Browser form tìm nhà hàng “Phở”: GET render 7 địa điểm, 6 mục/trang.
- Browser form quản trị preview: đúng label, checkbox và nút submit disabled.
- Ảnh/typography được kiểm tra bằng screenshot; snapshot preview lưu trong artifacts/landing-preview.jpg.
- `api/.env` đã có kết nối Session pooler thật, được gitignore. Không có secret được đưa vào source.
- `db:check` và `db:push` thành công trên Supabase project block5-dev. Direct endpoint chỉ có IPv6; đã đổi sang Session pooler 5432 theo endpoint trên dashboard.
- Integration PostgreSQL thật đạt 1/1: tạo schema UUID riêng và CRUD cả ba model; schema test đã được xóa sau khi chạy. TEST_DATABASE_URL được cấp riêng cho tiến trình kiểm thử, không lưu thêm vào .env.
- `npm start` đang chạy với database thật. Bảy trang landing/món/chi tiết/quản trị/form thêm trả 200 và không còn nhãn preview.
- Supabase MCP xác minh ba bảng public có RLS bật; dữ liệu tại thời điểm kiểm tra: 37 dishes, 4 chefs, 10 ingredients. Seed của ứng dụng là 12 món; các bản ghi bổ sung được giữ nguyên.

## Chưa xác minh / cần cấu hình

- Chưa triển khai hosting; admin không có authentication, chỉ phục vụ demo local.
- CSS có reduced-motion, focus và nền ảnh fallback local. Chưa kiểm tra bằng screen reader, chưa giả lập từng dịch vụ ảnh mất kết nối hoặc cấu hình reduced-motion của hệ điều hành.

## Bước nghiệm thu database

Kết nối và nghiệm thu database đã hoàn tất. Các lần chạy tiếp theo chỉ cần npm start. Khi thay đổi model, kiểm tra diff và phối hợp nhóm trước khi db push. Nếu muốn chạy lại test PostgreSQL, điền TEST_DATABASE_URL cho môi trường test rồi chạy npm run test:db. Test tạo/xóa schema UUID riêng, không reset public. Dữ liệu mới cần nhập qua trang quản trị hoặc các script migration/import phù hợp.


## Catalog Supabase — 12/10/2026

- Đã áp dụng migration catalog thật: 36 restaurants, 69 dishes (68 món liên kết + ice_cream giữ nguyên), 36 bản gốc trong restaurant_import_archive, 6 stories minh họa. RLS bật trên các bảng mới.
- Không có tham chiếu michelin-restaurants.json trong src/public/scripts/prisma. Preview cũng đọc database.
- Địa chỉ và món có đối chiếu nguồn trong docs/restaurant-provenance.md. Các hồ sơ chưa có món cụ thể giữ danh sách trống; giá món chưa xác nhận lưu null.
- npm test: 16/16 đạt, gồm tìm không dấu, khu vực, món nổi bật, API gợi ý, liên kết quán–món và CRUD.
- node api/scripts/test-catalog-migration.js: đạt trong schema riêng trên PostgreSQL Supabase; kiểm tra archive, giữ món người dùng, chạy lại không nhân đôi và trigger cập nhật tìm kiếm khi đổi món. Schema thử đã dọn.
- Browser với dữ liệu thật: nhập pho xuất hiện gợi ý; chọn bằng phím mũi tên/Enter cập nhật kết quả tại chỗ; nút Món chay tìm Chay Garden; không có lỗi JavaScript.
- Thay đổi quán: /admin/restaurants. Thêm/sửa món và chọn quán: /admin/dishes.
- Dùng npm run db:migrate:catalog cho migration này; db:push riêng không cài trigger. Không có seed demo; dữ liệu mới cần nhập qua trang quản trị hoặc các script migration/import phù hợp.

## Phân trang và quan hệ món ăn — 13/10/2026

- Database thật đã bổ sung: 88 dishes, 39 restaurants (3 demo), 12 chefs, 43 ingredients. Không còn NULL ở price, photoType, restaurantId, chefId của 88 món; mọi món có nguyên liệu liên kết. Các trường nguồn tùy chọn vẫn có thể NULL có chủ đích.
- 63 giá thiếu đã được thêm dưới dạng demo; 25 món chưa gắn quán được liên kết với 3 quán hư cấu. Giá và ảnh đã có được giữ nguyên. Liên kết công thức mới được ghi recipeIsDemo.
- Migration chỉ thêm cấu trúc; dish_ingredients có PK ghép và FK cascade cho liên kết. Xóa chef đặt chefId thành NULL; không xóa món. RLS bật cho bảng nối.
- npm test: 21/21 đạt trước chỉnh sửa cuối của quy tắc công thức và hiển thị tất cả nút trang. Bốn trường hợp khớp tên nguyên liệu dễ sai đã kiểm tra bằng chạy trực tiếp hàm. Lượt chạy lại suite cuối bị từ chối quyền thực thi, nên không ghi nhận suite mới là đã chạy.
- PostgreSQL thật: integration test đạt trong schema test riêng, kiểm tra 88 món qua 8 trang, lọc nhà hàng/khu vực, sắp xếp giá, CRUD quan hệ và chef/dish delete; schema test đã dọn, không sửa public qua test.
- Chạy lại enrich thông thường: 0 giá mới, 0 quán gắn thêm, 0 công thức mới; không nhân đôi món/seed. Refresh công thức demo sau sửa matching giữ nguyên giá/ảnh.
- Browser database thật: đủ nút trang 1–8; trang 8 hiển thị 85–88 (4 thẻ). Lọc Quận 3 + giá giảm dần: 21 món, trang 2 giữ query và hiển thị 13–21.
- Responsive 375px, 768px, 1440px: không tràn ngang. Form có label, GET SSR và mặc định/Tất cả món ăn hoạt động.
- Cần khởi động lại server cổng 3000 đang chạy để nạp code mới. Xem CATALOG_UPDATE.md cho cách dùng và giới hạn dữ liệu demo.
## Popup thực đơn và ảnh không gian quán — 13/10/2026

- Đã chuyển bộ lọc từ trang vào dialog tại “Tất cả món ăn ↗”. 8 lựa chọn sort là link GET SSR, giữ bộ lọc và reset về trang 1; lọc chi tiết vẫn dùng form GET.
- Đã cập nhật 39/39 restaurants trên Supabase: 36 ảnh mặt tiền/nội thất quán thật và 3 ảnh không gian Unsplash minh họa quán hư cấu. Chỉ đổi imagePath/photoType; không thay bảng dishes. Bản sao URL cũ lưu ở .local-backups/ ngoài Git.
- 39 URL kiểm tra HTTP 200 và đọc được thành ảnh; đã xem contact sheet và đối chiếu chi nhánh. Ănăn Saigon có link trả 200 trực tiếp nhưng lỗi khi nhúng, đã thay và xác minh lại.
- Browser kiểm tra đủ 7 trang quán: 39 ảnh nguồn hiển thị, không rơi vào fallback. Nguồn ảnh có link riêng ở thẻ/trang chi tiết; fallback riêng là hình không gian quán.
- 8/8 kiểm thử mục tiêu đạt: pagination88, filter/sort giữ query, CRUD quan hệ, tên nguyên liệu, CSP, nguồn ảnh và popup links. Các file JS mới kiểm tra cú pháp đạt. Không chạy lại toàn bộ suite trong lượt này.
- Popup 375/768/1440px không tràn ngang. Escape đóng và trả focus; chọn “Theo nhà hàng” đổi query ngay. Form Quận 3 + giá giảm dần trả 21 món. Đã reset viewport trình duyệt sau kiểm tra.
- Server nghiệm thu chạy riêng ở 3001; cần khởi động lại server của người dùng tại 3000 để nạp code/CSP mới. Chi tiết và nguồn ảnh: RESTAURANT_IMAGES.md.
