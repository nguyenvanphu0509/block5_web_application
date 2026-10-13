# Món ăn, phân trang và dữ liệu liên kết

## Trang món ăn

`/dishes` dùng phân trang SSR, 12 món/trang. 88 món tương ứng 8 trang (trang cuối 4 món). Tổng trang được tính bằng `count` theo bộ lọc, không giới hạn cứng ở 6 trang. Sáu trang cũ ở trang chủ là phân trang nhà hàng, không phải món ăn.

Bộ lọc GET: `q`, `restaurantId`, `district`, `category`, `chefId`, `ingredientId`, `available`. Sắp xếp `sort`: `default`, `name`, `price-asc`, `price-desc`, `restaurant`, `district`, `category`, `chef`. Đổi bộ lọc quay lại trang 1; link chuyển trang giữ bộ lọc. Thứ tự có ID làm tiêu chí cuối để không trùng/bỏ sót khi giá hoặc tên giống nhau. Giá chưa xác nhận được đặt cuối danh sách khi sắp xếp giá.

Link “Tất cả món ăn ↗” bỏ toàn bộ bộ lọc và trở về thứ tự ID tăng dần. Trang vượt giới hạn có empty state và link về trang đầu.

## Dữ liệu thật và demo

Mốc kiểm tra trước bổ sung: 88 món, 36 quán, 4 đầu bếp, 10 nguyên liệu; 63 món thiếu giá, 33 món thiếu photoType, 25 món chưa gắn quán.

- Giá thiếu được bổ sung theo quy tắc demo trong `data/catalog-enrichment.js`, với `priceIsDemo=true`. Giá đã có được giữ lại. Giá từ 24 món ảnh người dùng trước đây cũng được đánh dấu demo.
- Không gán các món ảnh Unsplash vào nhà hàng Michelin. Ba quán hư cấu riêng: Bếp Quốc Tế, Bếp Hải Sản và Góc Cà Phê; `isDemo=true`, tên có hậu tố Demo, địa chỉ và khu vực ghi minh họa.
- Tám đầu bếp mới là nhân vật hư cấu. Quan hệ đầu bếp/nguyên liệu được suy ra để làm bài tập, không phải công thức hay nhân sự xác nhận của quán. Các món được bổ sung quan hệ có `recipeIsDemo=true`.
- Giá, ảnh, tên và liên kết đã có không bị thay thế bởi script bổ sung. Không tạo lại món đã xóa, không reset bảng.
- Trường `michelinUrl` được để trống ở quán demo; `verifiedAt` chỉ có khi đã xác minh. `priceMinVnd`/`priceMaxVnd` trong dishes là trường khoảng giá tùy chọn còn từ catalog cũ, không phải giá món bắt buộc. `importKey` có thể trống cho món tạo thủ công. Không điền thông tin nguồn giả chỉ để tất cả cột hết NULL.

## Quan hệ và xóa

`Dish.restaurantId → Restaurant.id` và `Dish.chefId → Chef.id`: xóa quán/đầu bếp giữ món, đặt khóa ngoại thành NULL.

`dish_ingredients` là bảng nối N–N có khóa chính `(dishId, ingredientId)`. Xóa món chỉ xóa các liên kết nguyên liệu của món đó, giữ nguyên nguyên liệu. Xóa nguyên liệu gỡ các liên kết của nó, giữ món.

Form quản trị món có lựa chọn quán, đầu bếp, nhiều nguyên liệu và checkbox demo. URL ảnh đã chọn từ các nguồn được duyệt có thể được giữ lại khi chỉnh sửa. Validation từ chối ID liên kết không tồn tại và URL ngoài danh sách nguồn ảnh cho phép.

## Chạy lại

Từ thư mục project, `.env` đã có DATABASE_URL:

```sh
node scripts/migrate-dish-relations.js --apply
npm run db:generate
node scripts/enrich-catalog.js --apply
npm start
```

Migration chỉ thêm cấu trúc và có thể chạy lại. Script bổ sung dùng catalogKey cho dữ liệu demo và không nhân đôi khi chạy lại. Không dùng reset hoặc force để đồng bộ schema.

Tùy chọn `--refresh-demo-recipes` chỉ dùng khi chủ động muốn tạo lại gợi ý đầu bếp/nguyên liệu cho các món còn `recipeIsDemo=true` và đầu bếp thuộc catalog demo. Tùy chọn này thay các liên kết công thức demo đã có; không dùng nó nếu đã tùy chỉnh công thức mà muốn giữ lại. Lệnh thông thường ở trên không thay công thức đã có. Bảng nối mới bật RLS; ứng dụng vẫn truy vấn bằng Prisma trên server.

Trước khi thêm món từ những script cũ, nhớ chúng có thể tạo lại một món đã bị xóa nếu importKey tương ứng không còn. Script enrich chỉ làm việc với món hiện có.

## Kiểm thử

`npm test`: HTTP test double, bao gồm phân trang 88 món, bộ lọc/sắp xếp kết hợp, query không hợp lệ, CRUD quan hệ và ảnh.

`npm run test:db`: cần TEST_DATABASE_URL; tạo schema test riêng, đồng bộ Prisma, kiểm thử PostgreSQL thật rồi dọn schema đó. Không chạy thao tác CRUD test trong public.
