# Block 5 — bản SSR để đối chiếu

Code Express/EJS cũ nằm trong `src/`; JavaScript dành riêng cho SSR nằm trong `public/js/`.

Chạy từ thư mục gốc bằng `npm run dev:ssr` hoặc `npm run start:ssr`. Backend đọc cấu hình từ `api/.env`, dùng chung Prisma/database helper tại `api/src/` và CSS/ảnh tại `web/public/`. Đây là bản tham khảo, không phải frontend Block 6.

Không chạy SSR và REST API cùng cổng 3000. Có thể chạy SSR riêng với `PORT=3001 APP_ORIGIN=http://localhost:3001 npm run start:ssr`.
