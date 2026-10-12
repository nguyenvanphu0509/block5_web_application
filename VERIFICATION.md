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
- `.env` là placeholder local, được gitignore. Không có secret được đưa vào source.

## Chưa xác minh / cần cấu hình

- Chưa có DATABASE_URL thật: chưa db push, seed hoặc kiểm thử đọc/ghi trên Supabase.
- `npm run test:db`: 1 test skip vì thiếu TEST_DATABASE_URL. Không coi skip là integration pass.
- Idempotency seed và sequence đã được triển khai cùng integration test nhưng chưa chạy trên PostgreSQL thật.
- Chưa triển khai hosting; admin không có authentication, chỉ phục vụ demo local.
- CSS có reduced-motion, focus và nền ảnh fallback local. Chưa kiểm tra bằng screen reader, chưa giả lập từng dịch vụ ảnh mất kết nối hoặc cấu hình reduced-motion của hệ điều hành.

## Bước nghiệm thu database

Điền DATABASE_URL trong .env trên máy (Session pooler 5432), rồi chạy db:check → db:generate → db:push → db:seed → npm start. Nếu muốn test tự động với PostgreSQL thật, điền TEST_DATABASE_URL cho môi trường test và chạy npm run test:db. Test tạo/xóa schema UUID riêng, không reset public.
