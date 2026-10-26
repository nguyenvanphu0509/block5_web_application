# Nhập 24 món minh họa từ ảnh người dùng

Dữ liệu nằm trong `api/data/user-image-dishes.json`. Tất cả 24 URL được giữ nguyên theo danh sách người dùng. Tên món, mô tả và giá là demo được đặt dựa trên hình minh họa, không phải menu/giá/công thức xác nhận của nhà hàng. Có cả đồ uống.

## 1. Kiểm tra trước khi ghi

Từ thư mục project:

```sh
node api/scripts/import-user-dishes.js --dry-run
```

Lệnh này không kết nối hoặc ghi database. Bạn có thể sửa tên, mô tả, giá trong JSON trước khi nhập; giữ nguyên importKey để tránh trùng khi chạy lại.

## 2. Nhập vào Supabase

Đảm bảo `api/.env` có DATABASE_URL thật và Prisma Client tương ứng schema hiện tại. Script không tự db push hoặc thay đổi cấu trúc bảng.

```sh
node api/scripts/import-user-dishes.js
```

Script dùng một transaction, upsert theo importKey. Nếu chạy lại, giữ nguyên bản ghi đã có, không nhân đôi hoặc ghi đè chỉnh sửa. Ảnh Pizza đầu tiên dùng đúng importKey của api/scripts/add-pizza.js, nên chạy cả hai script không thêm trùng Pizza. Nếu trước đây bạn tự tạo bản ghi tương tự nhưng không dùng importKey này, script không tự dò tên và gộp bản ghi đó.

Không chạy seed cũ để nhập danh sách này. Các giá trị createdAt và id được database sinh tự động. Không gắn món minh họa vào nhà hàng Michelin.

## 3. Nguồn ảnh và giao diện

Danh sách nguồn ảnh công khai nằm ở `shared/image-sources.js`, dùng cho validator backend và CSP của server frontend/SSR. Các nguồn Unsplash, Unsplash+, iStock và các nguồn đã duyệt hiện đã có trong danh sách. Khi thêm nguồn mới, cập nhật chính sách này thay vì sửa riêng từng form.

Script nhập chỉ lưu URL, không tải hoặc upload ảnh lên Supabase Storage. Sau khi nhập, mở frontend tại `http://localhost:5173/dishes` để tìm theo tên món. Khởi động lại server nếu có thay đổi source/chính sách ảnh.

Ảnh Unsplash+ và iStock có thể cần giấy phép; việc URL mở được không bảo đảm quyền sử dụng hoặc đường dẫn sẽ luôn tồn tại.
