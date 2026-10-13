# Ảnh không gian nhà hàng và popup thực đơn

Cập nhật ngày 13/10/2026, đã áp dụng trên Supabase.

- 36 quán thật dùng ảnh mặt tiền hoặc nội thất tương ứng; không dùng ảnh đĩa thức ăn làm ảnh quán.
- 3 địa điểm hư cấu dùng 3 ảnh không gian khác nhau từ Unsplash, ghi rõ “Không gian minh họa · Demo”.
- URL ảnh, trang nguồn và metadata nằm trong `data/restaurant-space-images.json`. Link “Nguồn ảnh không gian” hiển thị trên thẻ và trang chi tiết. Những URL là nguồn bên ngoài, có thể thay đổi sau lần kiểm tra này.
- Chỉ cập nhật `restaurants.imagePath` và `restaurants.photoType`; ảnh trong `dishes` không thay đổi. Bản sao URL cũ được lưu trong `.local-backups/` (đã bỏ khỏi Git).
- Có ảnh dự phòng riêng cho nhà hàng `/images/restaurant.svg`, dùng khi nguồn ảnh lỗi; không thay bằng hình minh họa món ăn.

Các lệnh đối chiếu/cập nhật lại, không tạo thêm bản ghi:

```sh
node scripts/update-restaurant-images.js --check
node scripts/update-restaurant-images.js --apply
```

Script yêu cầu đúng ID, tên và nhãn demo của 39 quán đã duyệt. Nếu catalog thay đổi, script dừng; cập nhật file dữ liệu có chủ đích trước khi chạy lại. Khi ghi, điều kiện URL trước đó giúp tránh đè ảnh vừa được thành viên khác sửa. Chạy lại khi URL đã đúng báo 0 thay đổi.

Nút “Tất cả món ăn ↗” trên `/dishes` mở popup chỉ chứa tám link sắp xếp qua GET SSR. Thanh “Tìm món ăn” nằm trên trang, bên ngoài popup. Tìm kiếm và đổi cách sắp xếp giữ các điều kiện hiện tại, đưa về trang 1. “Bỏ bộ lọc” trở về toàn bộ thực đơn. Popup đóng bằng ×, Escape hoặc bấm nền, rồi trả focus về nút mở. Menu có thể cuộn trên màn hình nhỏ.

Khởi động lại server đang chạy để nạp code, CSP và danh mục nguồn ảnh mới: Ctrl+C trong terminal của server rồi `npm start`. Sau đó tải lại trang.

Nghiệm thu: 39 link HTTP 200 và giải mã được thành ảnh, xem ảnh tổng hợp và đối chiếu tên/chi nhánh; toàn bộ 39 ảnh tải thực tế trong trình duyệt trên bảy trang địa điểm. Link Ănăn từ Vietnam.travel trả ảnh trực tiếp nhưng lỗi khi nhúng, đã thay bằng nguồn khác cùng quán. 8 kiểm thử HTTP/catalog đạt. Popup ở 375px, 768px và 1440px không tràn ngang; lọc Quận 3 + giá giảm dần trả 21 món qua GET. Không tải ảnh vào tài nguyên ứng dụng; ứng dụng dùng URL ngoài kèm nguồn.
