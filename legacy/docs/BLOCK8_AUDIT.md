# Đối chiếu Block 8 — legacy (bản ghi trước khi sửa)

Cập nhật sau sửa ngày 02/11/2026: đã xử lý 6 điểm người dùng yêu cầu trong code, cập nhật test avatar; `test:flow` đạt 8/8 trên database/email giả lập và không chụp ảnh. Chi tiết cơ chế gửi email nền và migration được ghi ở cuối README. Nội dung bên dưới được giữ làm lịch sử phát hiện, không phải danh sách lỗi còn tồn tại của bản mới. Không suy ra rằng đã nghiệm thu SMTP/PostgreSQL production hoặc làm đủ bộ bằng chứng nộp bài.

Ngày kiểm tra: 02/11/2026. Phạm vi: `legacy/`, các helper dùng chung được đọc để hiểu luồng. Đây là báo cáo kiểm tra; không sửa mã ứng dụng hoặc test.

Nguồn: [slide bài giảng](https://pub.nndkhoa9.win/web/week6/block8-deck.html#41). Đã tải và đọc toàn bộ 66 slide, lấy slide 48–63 làm tiêu chí bài tập chính. Các điểm chi tiết ở slide 10, 19, 42, 45, 46 được ghi riêng để không đánh đồng mọi ví dụ trong bài giảng với tiêu chí bắt buộc.

**Kết luận: đã triển khai phần lớn chức năng chính, nhưng chưa đủ cơ sở xác nhận đạt toàn bộ yêu cầu và nghiệm thu.** Có đường xóa multipart bỏ qua CSRF token, một số khác biệt so với chi tiết trong slide, test trình duyệt đang đỏ và bộ bằng chứng nộp chưa đầy đủ trong thư mục đã kiểm tra.

## 1. Những phần đã có

| Yêu cầu | Kết quả đọc mã / kiểm thử | File chính |
|---|---|---|
| Đăng ký chuẩn hóa email, pending, role viewer do server gán | Có trim/lowercase; body role không được dùng khi INSERT; default viewer trong DB. Pending không được đăng nhập. | `src/auth/index.js:62`, `src/auth/crypto.js:8`, `migrations/001-auth.sql:2` |
| CAPTCHA đăng ký trước password hash/tạo user/gửi email | Có; ảnh bằng svg-captcha, hạn 2 phút, dùng một lần, gắn session và purpose. | `src/auth/index.js:29`, `:42`, `:62` |
| OTP kích hoạt | Có OTP 6 chữ số, HMAC, hạn 10 phút, attempts, khóa, cooldown; dùng transaction/row lock; active và email_verified_at; không tự đăng nhập. | `src/auth/activation.js`, `src/auth/index.js:73` |
| Gửi lại OTP | Mã mới thay hash cũ, không reset attempts khi resend. Có giới hạn gửi. Có khác biệt phản hồi được ghi ở mục 3. | `src/auth/activation.js:20`, `src/auth/index.js:64` |
| Password hash phù hợp | Có scrypt với salt ngẫu nhiên; không dùng SHA-256 trực tiếp làm password hash. | `src/auth/crypto.js:10` |
| Session/cookie SSR | Default PostgreSQL store, HttpOnly, SameSite=Lax, Secure khi HTTPS, regenerate sid và save trước 303. | `src/auth/index.js:20`, `:80` |
| Brute force | Đếm PostgreSQL theo email/IP; CAPTCHA sau ngưỡng, khóa 429; CAPTCHA đúng không xóa đếm. Chính sách đã công bố trong README. | `src/auth/index.js:23`, `:77`; `README.md:27` |
| Logout | POST, destroy session trước clearCookie. | `src/auth/index.js:81` |
| Bảo vệ CRUD | Middleware chặn toàn bộ prefix admin/dishes/restaurants và API gợi ý trước controller/upload; user phải active và version khớp. | `src/auth/index.js:30–33`, `src/app.js` |
| CSRF | Form thường và multipart create/update có kiểm tra; Origin được kiểm tra. Có lỗ hổng tính nhất quán ở multipart DELETE, xem mục 2. | `src/app.js:31`, `src/routes/index.js` |
| Quên/reset password | Reset token ngẫu nhiên 32 byte, DB lưu SHA-256, hạn 15 phút, dùng một lần; token mới hủy token cũ; POST mới đổi password; thu hồi session bằng DELETE và version; không tự đăng nhập. | `src/auth/index.js:82–104` |
| Referrer và cache | Reset có no-referrer; auth/private có no-store. | `src/auth/index.js:30` |
| Tài liệu và sơ đồ | README có cơ chế, ngưỡng, sơ đồ; có nhật ký lỗi. | `README.md`, `docs/AUTH_BUG_LOG.md` |

“Có” ở bảng trên có nghĩa là đã tìm thấy triển khai trong mã; không có nghĩa mọi điều kiện đã được nghiệm thu trên PostgreSQL/SMTP thật trong lần kiểm tra này.

## 2. Điểm cần sửa trong cơ chế bảo vệ form

### Multipart DELETE có thể bỏ qua CSRF token

Liên quan slide 52, 57, 60 và chính sách CSRF đã công bố của dự án.

- `src/app.js:31`: bỏ qua `auth.csrf` cho tất cả request multipart, chờ route kiểm tra sau parse.
- `src/routes/index.js:27`: create/update gọi csrf sau multer, nhưng route DELETE chỉ gọi controller.destroy.
- Vì vậy POST multipart tới `/admin/dishes/:id?_method=DELETE`, với session hợp lệ nhưng không có `_csrf` và không có Origin, vẫn xóa được bản ghi.

Đã tái hiện trên fixture trong bộ nhớ: urlencoded thiếu token trả 403; multipart có foreign Origin trả 403; multipart thiếu token và Origin trả 303 và bản ghi fixture bị xóa.

Giới hạn kết luận: kiểm tra Origin hiện có vẫn chặn request mang Origin khác. Đây là đường bỏ qua CSRF token được chứng minh bằng HTTP; chưa khẳng định khai thác được từ một trang web khác trong browser với chính sách cookie/Origin hiện tại.

Cách xử lý: mọi DELETE cần đi qua auth.csrf; nếu không hỗ trợ multipart DELETE thì từ chối loại nội dung đó trước controller. Bổ sung test cho từng method/content type thay vì chỉ thử multipart create.

## 3. Các điểm chưa khớp với chi tiết slide

### Phản hồi /forgot có thể phân biệt bằng thời gian — slide 42

`src/auth/index.js:85–97` chỉ chờ SMTP trong nhánh user tồn tại; nhánh không tồn tại trả ngay. Thông báo và status chung đã đúng, thời gian thì chưa được làm đồng đều.

Đã dùng mailer giả lập chậm 600 ms: email không tồn tại mất 19/6 ms, email có tài khoản mất 615/608 ms. Đây là bằng chứng luồng phụ thuộc thời gian gửi thư, không phải đo SMTP production. Nên tách gửi email ra hàng đợi với phản hồi chung và chính sách xử lý lỗi phù hợp.

### GET reset chưa báo token sai/hết hạn/đã dùng — slide 45

`src/auth/index.js:35–38` luôn render form, không tra token trước khi render. Cả bốn trường hợp thiếu token, token sai, hết hạn và đã dùng đều trả 200 cùng ô password.

POST reset vẫn kiểm tra và từ chối token không hợp lệ, nên không kết luận đổi được password bằng token sai. Điểm thiếu nằm ở trạng thái trang GET: cần hiển thị link không còn dùng được mà không tiêu thụ token hợp lệ.

### Reset thành công chưa gửi email báo đổi password — slide 46

`src/auth/index.js:99–103` đổi hash, hủy token/session và redirect, nhưng không gọi send cho thông báo đổi password. Trong phép thử, reset trả 303 thành công và số email thông báo mới là 0. Cần gửi email xác nhận thay đổi, không chứa password.

### Resend OTP phản hồi khác nhau theo tài khoản — slide 19

`src/auth/index.js:64–71`: pending đang cooldown/locked trả 429; email không tồn tại trả 303. Đã tái hiện pending cooldown = 429, email không tồn tại = 303. Điều này không khớp yêu cầu phản hồi giống nhau ở slide 19. Nên áp chính sách cooldown/giới hạn và phản hồi nhất quán theo email đầu vào, không để status bộc lộ việc tồn tại pending user.

### Mô hình dữ liệu chưa bám đủ trường — slide 49 và slide 10

- `migrations/001-auth.sql:3` chưa có cột purpose trong activation challenge như slide 49. Hiện purpose được tách ngầm bằng bảng activation và route riêng; chưa thấy token được dùng chéo route, nhưng nếu đối chiếu danh sách trường thì còn thiếu.
- User chỉ lưu email đã chuẩn hóa; không có bản email gốc như mô tả ở slide 10. Tiêu chí bài tập slide 49–50 chỉ nhấn mạnh bản chuẩn hóa duy nhất, nên đây là khác biệt với phần giảng chi tiết, không nên đánh đồng với thiếu chức năng đăng ký.

Không coi các con số minh họa trong slide là bắt buộc nếu đề cho nhóm công bố chính sách riêng. Không yêu cầu thêm reCAPTCHA, Passport, MFA hoặc phân quyền CRUD theo role khi đề không bắt buộc.

## 4. Kết quả test hiện tại

Chạy `npm --prefix legacy run test:flow` với quyền mở localhost: **6 pass, 1 fail**.

Fail tại `tests/flow.test.js:103`: test đòi nút Đăng xuất phải nhìn thấy ngay sau login. Giao diện mới chủ đích ẩn nút trong avatar, nên assertion cũ không còn phù hợp. Cần mở menu rồi kiểm tra/bấm logout. Assertion này chưa được cập nhật khi đổi avatar trong công việc giao diện trước đó.

Test browser dừng tại assertion đó nên phần reset password nằm sau nó không được thực thi trong ca này. Ca HTTP reset/CSRF riêng vẫn pass. Không được ghi “7/7 pass” cho trạng thái code hiện tại.

Đã chạy thêm script tái hiện riêng trong /tmp, dùng pg-mem, MemoryStore và email giả lập. Không đọc .env, không gửi mail thật, không đổi database thật. Các quan sát được lưu bên dưới. Không coi MemoryStore của test là store production: production mặc định dùng connect-pg-simple.

Chưa chạy lại `tests/auth.test.js` trên PostgreSQL thật. File này có các test restart session, OTP đồng thời, cookie cũ và chống brute force, nhưng sự tồn tại của test không chứng minh chúng đã pass trong lần kiểm tra này. pg-mem cũng không thay thế PostgreSQL thật khi nghiệm thu row lock, transaction và concurrency.

## 5. Bằng chứng nộp bài — slide 58–63

Đã thấy ảnh giao diện trong `legacy/artifacts`, sơ đồ ở README và nhật ký lỗi. Chưa thấy bộ minh chứng Block 8 đầy đủ theo từng kịch bản trong thư mục đã kiểm tra, đặc biệt:

- Network và Application/Cookies trước/sau login, logout, reset; sid/token đã che.
- Bản ghi session còn sau restart, bị hủy sau logout/reset.
- Bản ghi hash/hạn/usedAt/attempts/lockedUntil cho OTP, CAPTCHA và reset.
- Request HTTP trực tiếp với CRUD chưa đăng nhập, CAPTCHA sai/hết hạn/dùng lại, khóa 429.
- Email OTP và reset nhận được trong hộp thư, đã che bí mật; email báo đổi password sau khi bổ sung.
- Kết quả nghiệm thu từng dòng slide 58–61 và trả lời được các câu hỏi slide 62.

Nếu bạn đã lưu các bằng chứng này ngoài repo thì cần bổ sung vào bộ nộp; báo cáo này không khẳng định chúng chưa từng được làm.

## 6. Thứ tự hoàn thiện đề xuất

1. Bịt đường multipart DELETE bỏ qua CSRF và bổ sung test.
2. Cập nhật test avatar để bộ kiểm thử có thể chạy hết luồng.
3. Sửa thời gian phản hồi /forgot, trạng thái GET reset, email báo đổi password và phản hồi resend.
4. Bổ sung/giải thích trường purpose theo yêu cầu dữ liệu.
5. Chạy ma trận PostgreSQL thật, xác nhận SMTP thực tế và gom minh chứng theo slide 63.

## 7. Quan sát từ phép thử cục bộ

Dữ liệu bên dưới là tài khoản/token giả tạo chỉ dùng trong bộ nhớ; không chứa credential hay token của hệ thống thật.

```json
{
  "resetGet": [
    {
      "case": "missing",
      "status": 200,
      "showsPasswordForm": true
    },
    {
      "case": "audit-invalid",
      "status": 200,
      "showsPasswordForm": true
    },
    {
      "case": "audit-expired",
      "status": 200,
      "showsPasswordForm": true
    },
    {
      "case": "audit-used",
      "status": 200,
      "showsPasswordForm": true
    }
  ],
  "forgotTiming": [
    {
      "exists": false,
      "status": 200,
      "ms": 19
    },
    {
      "exists": true,
      "status": 200,
      "ms": 615
    },
    {
      "exists": false,
      "status": 200,
      "ms": 6
    },
    {
      "exists": true,
      "status": 200,
      "ms": 608
    }
  ],
  "resend": {
    "pendingInCooldown": 429,
    "unknownEmail": 303
  },
  "resetNotice": {
    "status": 303,
    "notificationEmails": 0
  },
  "csrfDelete": {
    "urlencodedWithoutToken": 403,
    "multipartForeignOrigin": 403,
    "multipartWithoutTokenOrOrigin": 303,
    "deletedFromIsolatedFixture": true
  }
}
```
