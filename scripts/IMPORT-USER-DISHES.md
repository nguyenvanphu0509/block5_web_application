# Nhập 24 món minh họa từ ảnh người dùng

Dữ liệu nằm trong `data/user-image-dishes.json`. Tất cả 24 URL được giữ nguyên theo danh sách người dùng. Tên món, mô tả và giá là demo được đặt dựa trên hình minh họa, không phải menu/giá/công thức xác nhận của nhà hàng. Có cả đồ uống.

## 1. Kiểm tra trước khi ghi

Từ thư mục project:

```sh
node scripts/import-user-dishes.js --dry-run
```

Lệnh này không kết nối hoặc ghi database. Bạn có thể sửa tên, mô tả, giá trong JSON trước khi nhập; giữ nguyên importKey để tránh trùng khi chạy lại.

## 2. Nhập vào Supabase

Đảm bảo `.env` có DATABASE_URL thật và Prisma Client tương ứng schema hiện tại. Script không tự db push hoặc thay đổi cấu trúc bảng.
`
```sh
node scripts/import-user-dishes.js
```

Script dùng một transaction, upsert theo importKey. Nếu chạy lại, giữ nguyên bản ghi đã có, không nhân đôi hoặc ghi đè chỉnh sửa. Ảnh Pizza đầu tiên dùng đúng importKey của scripts/add-pizza.js, nên chạy cả hai script không thêm trùng Pizza. Nếu trước đây bạn tự tạo bản ghi tương tự nhưng không dùng importKey này, script không tự dò tên và gộp bản ghi đó.

Không chạy seed cũ để nhập danh sách này. Các giá trị createdAt và id được database sinh tự động. Không gắn món minh họa vào nhà hàng Michelin.

## 3. Cho phép hiển thị cả ảnh Plus và iStock

CSP hiện tại trong `src/middleware/security.js` chỉ cho phép images.unsplash.com, chưa cho phép hai host bổ sung. Trong chuỗi Content-Security-Policy, thêm hai host vào phần img-src (không phải default-src):

```text
https://plus.unsplash.com https://media.istockphoto.com
```

Phần img-src đầy đủ sau khi thêm:

```text
img-src 'self' https://images.unsplash.com https://plus.unsplash.com https://media.istockphoto.com https://prod-pics.guide.michelin.com https://*.supabase.co;
```

Lưu file rồi khởi động lại server bằng `npm start` (dừng server cũ trước). Mở `/dishes` và tìm theo tên món. Script nhập chỉ lưu URL; không tải hoặc upload ảnh lên Supabase Storage.

Ảnh Unsplash+ và iStock là nguồn có thể cần giấy phép trả phí; danh sách giữ link bạn cung cấp, không xác nhận quyền sử dụng. Việc URL mở được không bảo đảm quyền sử dụng hoặc đường dẫn sẽ luôn tồn tại.

## Giới hạn hiện tại

Validator của form quản trị chưa chấp nhận các URL Unsplash/iStock này. Script nhập trực tiếp qua Prisma nên không dùng validator form. Nếu muốn sửa món nhập bằng form và giữ URL ảnh, cần mở rộng validator có whitelist các host tương ứng; không bỏ qua lỗi hoặc thay URL ảnh bằng giá trị tùy ý. Các file nhập này không tự chỉnh validator hoặc CSP của ứng dụng.
