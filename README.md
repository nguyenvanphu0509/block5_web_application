# Ẩm thực Việt — Cách chạy dự án

Dùng **Node.js 24.x**, chạy lệnh tại thư mục gốc.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `api/` | Express REST API, Prisma/PostgreSQL, xác thực JWT |
| `web/` | React/Vite, gọi API bằng `fetch` |
| `legacy/` | SSR Express/EJS, xác thực session/cookie |
| `shared/` | Cấu hình dùng chung, chính sách nguồn ảnh |
| `tests/`, `scripts/` | Kiểm thử và công cụ chạy dự án |

Trong mỗi ứng dụng: `src/` chứa code, `public/` chứa ảnh/CSS/JS trình duyệt. Migration tạo/sửa cấu trúc database; seed nạp dữ liệu mẫu.

## Lệnh cần dùng

```sh
npm ci                              # Cài dependency
npm run dev                         # API :3000 + React :5173
npm run dev:ssr                     # SSR :3001
npm run build                       # Build React
npm test                            # Kiểm thử cấp dự án
npm --prefix legacy run test:flow    # Kiểm thử SSR bằng DB/email giả và Chrome
npm run db:generate                 # Sinh Prisma Client
npm run db:check                    # Kiểm tra kết nối database
```

Cấu hình theo `.env.example` trong `api/`, `web/`, `legacy/`. Giữ `.env` đang có, không commit secret. SSR cần session secret, SMTP và reCAPTCHA; frontend chỉ nhận cấu hình công khai.

Chỉ chạy `db:push`, `db:seed` hoặc `auth:migrate` khi cần thiết lập/cập nhật database, không chạy lại chỉ để mở website. Script nhập món có thể ghi dữ liệu; dùng `node api/scripts/import-user-dishes.js --dry-run` để kiểm tra trước.

Ảnh lỗi: kiểm tra URL và `shared/image-sources.js`. Không nhận OTP: kiểm tra SMTP, thư rác, thời gian chờ gửi lại. Giao diện không đổi: kiểm tra đúng ứng dụng React/SSR và đúng cổng.

Đọc tiếp: [Kiến thức quan trọng](docs/KIEN_THUC.md).
