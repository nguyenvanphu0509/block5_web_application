# Block 8 — Restaurant SSR

Express/EJS chạy độc lập tại http://localhost:3001; React SPA/API và lệnh chạy mặc định giữ nguyên. Dữ liệu danh mục dùng chung: CRUD trong SSR thay đổi dữ liệu SPA đang đọc. Xác thực SSR độc lập với localStorage demo của React.

## Thiết lập

Tại thư mục gốc: `npm ci`. Tạo `legacy/.env` từ `.env.example` nếu chưa có; đặt `SSR_SESSION_SECRET` ngẫu nhiên ít nhất 32 ký tự. Không ghi đè `.env` hiện có. Database mặc định lấy DATABASE_URL trong api/.env; SSR_DATABASE_URL có thể ghi đè cho cả danh mục và auth. Không cần sửa api/.env.

```sh
npm --prefix legacy run auth:migrate
# Điền SSR_SEED_EMAIL và SSR_SEED_PASSWORD (15–128 ký tự) trong legacy/.env trước khi seed:
npm --prefix legacy run auth:seed
npm run dev:ssr
```

Migration chỉ tạo schema `block8_auth` cùng bảng auth, không xóa/seed danh mục. Startup không tự migrate. Giữ nguyên migration khi rollback ứng dụng để tránh mất tài khoản. Tài khoản seed active; đăng ký qua UI luôn pending. Schema cần quyền CREATE; backup theo chính sách database hiện có.

Đặt SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM trong legacy/.env. Cổng 587 dùng STARTTLS bắt buộc; 465 dùng TLS ngay. Cần credential SMTP được nhà cung cấp cho phép; không dùng mật khẩu tài khoản thông thường nếu nhà cung cấp yêu cầu app password/OAuth. Chỉ nghiệm thu gửi thật sau khi hộp thư nhận OTP/link reset. Lỗi SMTP chỉ log thông báo chung, người dùng có thể gửi lại theo giới hạn. Không đưa secret vào chat, commit hoặc ảnh nộp.

Production đặt SSR_ORIGIN đúng HTTPS và SSR_PORT theo hosting. Nếu có reverse proxy, cấu hình trust proxy đúng số hop/IP tin cậy bằng SSR_TRUST_PROXY_HOPS (không bật tùy tiện vì ảnh hưởng IP rate limit). Cookie Secure yêu cầu Express nhận đúng HTTPS.

## Cơ chế

- Email trim + lowercase; password 15–128 ký tự, không trim; scrypt N=131072/r=8/p=1, salt ngẫu nhiên. Role do server gán viewer; mọi active user dùng CRUD.
- OTP: 6 chữ số, 10 phút, 5 lần sai khóa 15 phút, resend cách 60 giây, giữ số lần sai khi resend. HMAC trong DB, dùng một lần; kích hoạt không đăng nhập.
- CAPTCHA ảnh: 6 ký tự, 2 phút, một lần thử, gắn sid/purpose; chỉ trả ảnh và ID. Thư viện ảnh có thể bị OCR, không thay thế rate limit.
- Login: cửa sổ 15 phút; CAPTCHA sau 3 sai/email hoặc 10 sai/IP, khóa sau 10/email hoặc 50/IP trong 15 phút. Bộ đếm PostgreSQL, không bị xóa bằng cookie/CAPTCHA. Giới hạn nguồn IP phụ thuộc cấu hình proxy.
- Session PostgreSQL: sid thay khi login, HttpOnly/SameSite=Lax/Secure khi HTTPS, 8 giờ hoặc ghi nhớ 7 ngày, thời hạn tuyệt đối. Không share session với SPA.
- POST logout hủy sid; reset 32 byte ngẫu nhiên, SHA-256 trong DB, hạn 15 phút, token mới hủy token cũ; reset không active pending, không tự login và thu hồi phiên qua xóa session + version user.
- CSRF token gắn session cho mọi form POST/PATCH/DELETE kể cả multipart; kiểm tra Origin bổ sung. GET reset không tiêu thụ token. Trang auth/private no-store, reset no-referrer.
- Mọi route CRUD gồm đọc bị chặn bằng server middleware, trả 303 /login trước upload/ghi. Trang chủ và auth công khai. Chưa phân quyền role/MFA.

```mermaid
sequenceDiagram
  participant B as Browser
  participant S as SSR
  participant D as PostgreSQL
  participant M as SMTP
  B->>S: Register + CSRF + CAPTCHA
  S->>D: Verify challenge; create pending + OTP hash
  S->>M: Email OTP
  B->>S: Activate OTP
  S->>D: Consume OTP; active
  B->>S: Login + password (+ CAPTCHA when required)
  S->>D: Check limits/user; persist new session
  S-->>B: Set-Cookie sid; 303 /dishes
  B->>S: CRUD + cookie (+ CSRF on writes)
  S->>D: Resolve active user/session then CRUD
  B->>S: Forgot email
  S->>D: Save reset hash
  S->>M: Reset link
  B->>S: GET reset then POST new password
  S->>D: Consume token; change password; revoke sessions
  B->>S: Login again then POST logout
  S->>D: Destroy session
```

## Kiểm thử và bằng chứng

`npm --prefix legacy test` dùng schema block8_test tạm trong TEST_DATABASE_URL hoặc DATABASE_URL, dọn sau khi chạy; không thay đổi bảng danh mục. HTTP test dùng transport email giả lập, không gửi thư thật. `npm test` và `npm run build` kiểm tra hồi quy SPA/API.

Nghiệm thu theo slide 58–63: chụp Network, Application/Cookies, email và bảng auth, che sid/password/OTP/token. Kiểm tra restart bằng dừng/chạy lại tiến trình thật với cùng secret và cookie; đăng nhập/đăng xuất/reset dùng lại sid cũ. Kiểm tra form thay đổi từ Origin khác và request CRUD trực tiếp không cookie. Kiểm tra resend không reset attempts, hai request OTP đồng thời chỉ một thành công; CAPTCHA sai phiên/mục đích/hết hạn/dùng lại; khóa vẫn chặn dù CAPTCHA/password đúng.

Một lỗi phát hiện lúc triển khai: chèn CSRF bằng regex đơn giản làm hỏng thẻ form chứa biểu thức EJS trong enctype. Phát hiện bằng đọc markup và compile toàn bộ template; sửa bằng nhận diện khối EJS trước khi tìm dấu đóng thẻ. Không đưa bí mật vào bằng chứng.

Giao diện: `node legacy/scripts/visual-qa.js` từ gốc chạy Chrome headless, dùng danh mục thật ở chế độ chỉ đọc và schema auth tạm; cổng 3000/3001/5173 phải trống. Chụp SPA/SSR desktop 1440px và mobile 390px vào legacy/artifacts (không commit). `QA_QUICK=1` chỉ kiểm tra lại danh sách/auth SSR. Script hiện dùng Chrome macOS tại /Applications/Google Chrome.app; đổi executablePath nếu dùng môi trường khác.

`## 
# Block 8: SSR Express + EJS giữ giao diện hiện tại

## 1. Mục tiêu và ranh giới thay đổi

- Phát triển tiếp ứng dụng trong `legacy/`, giữ các chức năng Restaurant App và bổ sung đầy đủ xác thực theo slide 48–63.
- Chuyển giao diện hiện tại từ React sang EJS: trang chủ, danh sách, chi tiết, quản lý, biểu mẫu và giao diện đăng nhập/đăng ký.
- Không chỉnh source, CSS, xác thực demo, REST API hoặc lệnh chạy mặc định của SPA. Chỉ bổ sung dependency của workspace SSR và cập nhật lockfile tương ứng.
- Giữ lệnh `dev:ssr`/`start:ssr`; SSR mặc định chạy tại `http://localhost:3001`, tách cổng API 3000.
- Dùng chung dữ liệu danh mục theo lựa chọn của người dùng. Kiểm thử ghi dữ liệu chạy trong database/schema thử nghiệm riêng.

## 2. Giao diện, dữ liệu và kiến trúc

**Chuyển giao diện**

- Lấy bản React hiện tại làm chuẩn về bố cục, màu, font, ảnh, responsive và các trạng thái hiển thị.
- Sao chép CSS/ảnh cần thiết vào tài nguyên riêng của SSR; chuyển JSX sang partial EJS. Không sửa hoặc tạo phụ thuộc runtime vào React.
- Thay React Router bằng liên kết và form SSR; truy vấn tìm kiếm, bộ lọc, sắp xếp, phân trang nằm trong URL.
- Giữ chức năng CRUD, upload/chọn ảnh và quan hệ món–nhà hàng–đầu bếp–nguyên liệu. Bổ sung giao diện các chế độ tìm kiếm/phân trang đang có ở SPA bằng helper hiện hữu theo chế độ chỉ đọc source.
- Dùng JavaScript riêng cho slideshow, hiện mật khẩu, menu, gợi ý tìm kiếm và preview ảnh. Nội dung chính và kết quả form phải render được bằng server.
- Giao diện auth lấy thiết kế React hiện tại nhưng bỏ thông tin tài khoản điền sẵn và hành vi đăng nhập demo.

**Dữ liệu**

- Tiếp tục dùng Prisma hiện hữu để đọc/ghi danh mục; không sửa schema hoặc helper của API.
- Thêm schema PostgreSQL riêng `block8_auth`, quản lý bằng migration SQL riêng của SSR và truy vấn tham số hóa qua `pg`.
- Các bảng: User, ActivationChallenge, PasswordReset, session, bộ đếm theo email/IP và thử thách CAPTCHA. Session chứa userId; User có phiên bản xác thực để thu hồi phiên khi reset.
- User có email chuẩn hóa duy nhất, tên hiển thị tùy chọn, passwordHash, role mặc định `viewer`, status và emailVerifiedAt. Server bỏ qua role từ form.
- Seed riêng tạo một tài khoản active từ biến môi trường; không seed lại danh mục, không commit mật khẩu.

**Thư viện và cấu hình**

- Session: `express-session` với PostgreSQL store `connect-pg-simple`.
- CAPTCHA ảnh: `svg-captcha`; sinh chuỗi bằng bộ sinh ngẫu nhiên an toàn của Node, dùng thư viện để dựng ảnh.
- Password: `crypto.scrypt` bất đồng bộ với salt ngẫu nhiên; cấu hình N=2^17, r=8, p=1 và bộ nhớ phù hợp.
- Email: Nodemailer qua SMTP, cấu hình trong `.env` riêng của SSR. OTP/reset dùng URL origin cấu hình sẵn.
- Migration và seed chỉ chạy bằng lệnh rõ ràng; startup không tự thay đổi database.

## 3. Luồng và hợp đồng HTTP

**Đăng ký, CAPTCHA và kích hoạt**

- `GET/POST /register`, có `/signup` chuyển hướng tới `/register`.
- Chuẩn hóa email bằng trim và chuyển chữ thường, áp dụng đồng nhất ở mọi luồng; mật khẩu 15–128 ký tự, không tự trim.
- Đăng ký luôn cần CAPTCHA hợp lệ tại server trước khi băm password, tạo tài khoản hoặc gửi OTP.
- CAPTCHA gồm 6 ký tự dễ phân biệt, hạn 2 phút, gắn phiên ẩn danh và mục đích register/login. Endpoint ảnh chỉ trả SVG, không trả đáp án; dùng một lần kể cả khi nhập sai.
- Tạo user pending, phản hồi chung cho email mới/đã có; không ghi đè password tài khoản cũ.
- `GET/POST /activate` và `POST /activate/resend`: OTP 6 chữ số, hạn 10 phút, tối đa 5 lần sai, khóa 15 phút, gửi lại cách nhau ít nhất 60 giây.
- OTP lưu HMAC với secret server, không lưu plaintext. Gửi lại thay mã cũ nhưng không đặt lại bộ đếm sai; sau thời gian khóa mới mở cửa sổ thử mới.
- Xác minh/tiêu thụ OTP trong transaction có khóa bản ghi; hai request đồng thời chỉ một request kích hoạt thành công.
- Kích hoạt thành công cập nhật active/emailVerifiedAt rồi chuyển tới đăng nhập; không tự cấp session.

**Đăng nhập và chống thử sai**

- `GET/POST /login`, xác thực bằng email và password; lỗi chung cho tài khoản không tồn tại, sai password hoặc chưa active.
- Bộ đếm lưu PostgreSQL theo email chuẩn hóa và IP, áp dụng cả email không tồn tại.
- Trong cửa sổ 15 phút: yêu cầu CAPTCHA sau 3 lần sai theo email hoặc 10 lần sai theo IP; khóa 15 phút khi đạt 10 lần theo email hoặc 50 lần theo IP.
- Đang khóa trả trang 429 kể cả password/CAPTCHA đúng; CAPTCHA đúng không xóa bộ đếm. Kiểm tra giới hạn trước bước băm password.
- Đăng nhập thành công tạo sid mới, lưu session trước khi trả `303`; mặc định tới `/dishes`, chỉ nhận redirect nội bộ thuộc các route đã cho phép.
- Cookie tên `sid`, HttpOnly, SameSite=Lax, Secure khi HTTPS, Path=/; không đặt Domain. Session hết hạn sau 8 giờ; chọn ghi nhớ là 7 ngày, không tự gia hạn vô hạn.
- Session còn hạn tiếp tục hoạt động sau restart. Trang riêng tư dùng Cache-Control: no-store.

**CRUD và đăng xuất**

- Middleware server bảo vệ toàn bộ `/admin`, danh sách/chi tiết `/dishes`, `/restaurants` và endpoint gợi ý danh mục. GET/POST/PATCH/DELETE chưa xác thực đều trả `303 /login` trước upload hoặc thay đổi dữ liệu.
- Trang chủ và các trang auth công khai; thông tin giới thiệu trên trang chủ vẫn render, liên kết vào CRUD đi qua kiểm tra đăng nhập.
- Mọi user active dùng được CRUD, chưa phân quyền theo role ở Block 8.
- `POST /logout` hủy session phía server rồi xóa cookie; dùng lại sid đã sao chép phải thất bại.
- Form đổi dữ liệu có CSRF token gắn session; kiểm tra Origin bổ sung. Hỗ trợ cả form thường và multipart, không dùng GET để thay đổi dữ liệu nghiệp vụ.

**Quên mật khẩu và email**

- `GET/POST /forgot`: cùng nội dung/status cho email có/không có. Giới hạn 3 yêu cầu/email và 10 yêu cầu/IP trong 15 phút; vượt ngưỡng trả 429.
- Email chứa `/reset?token=...`; token ngẫu nhiên 32 byte, lưu SHA-256, hạn 15 phút, một lần dùng. Token mới vô hiệu token reset cũ.
- `GET /reset` chỉ hiển thị form; `POST /reset` mới cập nhật password và usedAt trong transaction.
- Reset thành công thu hồi mọi session của user và tăng phiên bản xác thực; không kích hoạt user pending, không tự đăng nhập.
- SMTP dùng TLS, credential qua biến môi trường. Lỗi gửi không lộ email tồn tại hay bí mật; hiển thị phản hồi chung và cho phép thử lại theo giới hạn.
- Các endpoint gửi email có giới hạn theo email và IP; không đưa OTP/token/password vào log, flash message hoặc response.

## 4. Kiểm thử và bàn giao

- Kiểm tra HTML trả về đã có nội dung trang và form; không phụ thuộc React để tạo nội dung chính.
- So sánh ảnh SPA/SSR cùng dữ liệu ở desktop 1440px và mobile 390px: trang chủ, danh sách, chi tiết, quản lý, form và auth. Giữ bố cục, ảnh, typography và không tràn ngang.
- Kiểm thử toàn bộ ma trận slide 58–61: pending bị chặn, role giả bị bỏ qua, OTP hết hạn/dùng lại/gửi lại/đồng thời, CAPTCHA sai phiên/sai mục đích/dùng lại, bộ đếm không bị xóa bằng cookie hoặc CAPTCHA.
- HTTP test liệt kê từng route CRUD, kiểm tra 303 khi thiếu session và dữ liệu không đổi; kiểm tra CSRF với form thường và multipart.
- Kiểm tra restart tiến trình thật vẫn giữ session; logout/reset khiến sid cũ bị từ chối.
- Email tự động dùng transport giả lập để kiểm thử; nghiệm thu riêng bằng SMTP thật, nhận OTP và link reset trong hộp thư.
- Chạy các kiểm tra SPA/API hiện hữu phù hợp và build SPA; rà diff để xác nhận không sửa source SPA/API.
- Bàn giao tài liệu chạy SSR, migration/seed, biến môi trường, ngưỡng bảo vệ, sơ đồ luồng và checklist bằng chứng Network/Cookies/DB/email đã che bí mật.
- Ghi lại lỗi thực sự phát hiện trong triển khai cùng cách tái hiện và bằng chứng sửa; không dựng lỗi giả để nộp.

## 5. Mặc định đã chốt

- Express + EJS; CAPTCHA ảnh bằng thư viện; email thật qua SMTP cấu hình độc lập nhà cung cấp.
- Dùng chung database danh mục, auth nằm trong schema riêng. Thao tác CRUD thực tế ở SSR sẽ xuất hiện trên SPA.
- SPA không nhận hoặc dùng phiên đăng nhập SSR; REST API hiện tại không được bổ sung auth trong phạm vi này.
- SMTP credential và quyền tạo schema cần được cấu hình trước nghiệm thu thật; không đưa bí mật vào source hay tài liệu.
- Không triển khai Next.js, reCAPTCHA, MFA hoặc phân quyền role ở Block 8.

## Luồng đăng ký và OTP

Đăng ký hợp lệ trả 303 tới `/activate`; tải lại trang này không gửi lại POST đăng ký/CAPTCHA đã dùng. Màn hình OTP giữ email đăng ký trong phiên, có mã 6 số, thông tin hạn 10 phút và nút gửi lại đếm ngược 60 giây. Kích hoạt đúng trả 303 tới `/login`, hiển thị thông báo xác minh thành công; không tự đăng nhập theo yêu cầu Block 8. Nếu email đã đăng ký trước đó, dùng nút gửi lại OTP; đăng ký lại không ghi đè mật khẩu.

CAPTCHA bỏ khoảng trắng đầu/cuối và không phân biệt hoa/thường. Form chờ ảnh tải hoàn tất, khóa nút gửi trong lúc xử lý và không đổi challenge ID trước khi ảnh mới sẵn sàng. CAPTCHA vẫn chỉ dùng một lần, gắn phiên và mục đích.

Kiểm thử không đọc `.env`, không gửi email thật và không truy cập database thật:

```sh
npm --prefix legacy run test:flow
```

Test này chặn thao tác đọc file môi trường, dùng PostgreSQL giả lập trong bộ nhớ và kiểm tra cả HTTP lẫn Chrome: đăng ký, bấm hai lần, tải lại OTP, nhập OTP sai/đúng, chặn pending, chuyển đăng nhập và đăng nhập thành công. Test trình duyệt dùng Chrome macOS tại đường dẫn trong file test.


## 
Biến	Bạn cần nhập gì?
SMTP_HOST	Giữ nguyên smtp.gmail.com
SMTP_PORT	Giữ nguyên 587
SMTP_USER	Địa chỉ Gmail dùng để gửi OTP
SMTP_PASSWORD	App Password do Google cung cấp
SMTP_FROM	Tên và địa chỉ email người gửi, thường dùng cùng Gmail với SMTP_USER
SSR_SEED_EMAIL	Email tài khoản mẫu để đăng nhập ứng dụng SSR
SSR_SEED_PASSWORD	Mật khẩu tài khoản mẫu SSR do bạn tự đặt

## 
tuan sau mfa chuan bi gg authenticator 
Reset password: trang GET giữ Referrer-Policy no-referrer để không lộ token. Chrome có thể gửi Origin:null khi POST từ trang này; chỉ /reset được chấp nhận trường hợp đó khi Sec-Fetch-Site=same-origin và CSRF token khớp phiên. Origin khác, null/cross-site hoặc sai CSRF vẫn bị chặn trước khi đổi mật khẩu. Reset thành công tạo phiên ẩn danh mới và chuyển 303 /login, không giữ form đăng nhập ở URL /reset. test:flow kiểm tra cả submit Chrome thực tế và các trường hợp từ chối này mà không mở .env.

### Ảnh món và độ tin cậy OTP

Ảnh Chả cá Lã Vọng dùng trong SSR được lưu tại public/images/cha-ca-la-vong.jpg, từ nguồn ảnh minh họa đã có trong api/data/dish-image-replacements.json: https://cdn.sbfoods.co.jp/recipes/08983_l.jpg (trang nguồn https://www.sbfoods.co.jp/recipe/detail/08983.html). Đây là ảnh minh họa món cùng tên, không xác nhận là ảnh của nhà hàng. SSR chỉ ánh xạ hai URL cũ đã biết sang ảnh này khi render; không cập nhật database hoặc tài nguyên SPA. Các ảnh khác vẫn tôn trọng dữ liệu người dùng, có ảnh dự phòng khi tải lỗi.

Gửi OTP: đăng ký lại email pending có thể gửi lại mã khi hết thời gian chờ; không ghi đè password của user cũ. Luồng gửi khóa user/challenge trong cùng transaction, gửi email trước khi thay hash mã cũ, giữ attempts. SMTP từ chối thì giữ nguyên mã và hạn cũ; user mới vẫn pending và có thể thử lại. Chỉ thử lại tự động một lần cho lỗi kết nối/SMTP 4xx, cùng một mã OTP; EAUTH và từ chối vĩnh viễn không lặp lại. Không thể bảo đảm SMTP đã chấp nhận thì thư đã vào inbox: nhà cung cấp còn có thể lọc spam hoặc giao chậm. Giao diện dùng thông báo chung cho email mới/đã có và không khẳng định chắc chắn thư đã tới hộp thư.

Log SMTP chỉ ghi mã lỗi an toàn (ví dụ EAUTH, ETIMEDOUT), responseCode và số lần thử. Không ghi địa chỉ nhận, password, OTP, token hay nội dung phản hồi SMTP. test:flow bao gồm lỗi lần gửi đầu, phục hồi tài khoản pending, cooldown, gửi lại thất bại giữ mã cũ và gửi lại thành công. Cấu hình SMTP thật không được đọc bởi các bài test này.


[Nhật ký lỗi xác thực: nguyên nhân, cách sửa và bằng chứng](docs/AUTH_BUG_LOG.md)

# CSRF (Cross-Site Request Forgery)
là một kiểu tấn công bảo mật web, trong đó kẻ tấn công lừa trình duyệt của người dùng gửi yêu cầu đến một website mà họ đã đăng nhập, khiến website thực hiện hành động ngoài ý muốn của người dùng.

## Cập nhật hoàn thiện xác thực — 02/11/2026

Chạy lại `npm --prefix legacy run auth:migrate` trước khi khởi động bản mới. Migration thêm `activation.purpose` mặc định `activation` cho cả bản ghi đang có và bảng `mail_cooldowns`; không xóa tài khoản hay danh mục.

- DELETE luôn kiểm tra CSRF, kể cả request multipart. Form xóa thường vẫn hoạt động với token hợp lệ.
- GET reset sai, hết hạn, đã dùng hoặc thiếu token trả 400, chỉ hiện hướng dẫn yêu cầu link mới; GET hợp lệ không tiêu thụ token.
- `/forgot` trả phản hồi chung trước khi tra tài khoản và gửi SMTP. SMTP lỗi giữ link cũ còn hiệu lực, được ghi log an toàn. Email báo đổi mật khẩu được gửi sau khi reset thành công; không chứa mật khẩu.
- Resend OTP áp dụng cùng cooldown 60 giây theo email yêu cầu (kể cả email không tồn tại), lưu tại PostgreSQL và khóa bản ghi khi nhận lượt gửi. Cùng giới hạn 5 yêu cầu/email, 20/IP trong 15 phút. Request được nhận trả 303 chung; request lặp trong cooldown hoặc vượt quota trả 429. Trạng thái pending/cooldown/lock bên trong tài khoản không làm thay đổi phản hồi của request được nhận; khóa OTP vẫn ngăn gửi thư và xác minh. Gửi lại không reset attempts.
- Kiểm tra OTP chỉ nhận challenge có `purpose=activation`.

Tác vụ email của forgot/resend/thông báo reset chạy trong tiến trình sau khi HTTP response đã gửi. Khi tắt server bình thường, server đợi các tác vụ này trước khi đóng pool (tối đa 45 giây). Đây không phải hàng đợi bền vững: nếu tiến trình bị crash hoặc kill cưỡng bức khi chưa gửi xong, người dùng có thể cần yêu cầu lại. Không lưu reset token thô vào database để làm hàng đợi. Session, rate limit và cooldown vẫn lưu bền vững ở PostgreSQL.

Kiểm tra chức năng chính: `npm --prefix legacy run test:flow` (8 test, database/email giả lập, không chụp ảnh). Test avatar mở menu trước khi kiểm tra Đăng xuất. Các ca chính bao gồm email không đợi SMTP, reset token GET/POST, thông báo đổi mật khẩu, OTP purpose/cooldown và multipart DELETE thiếu CSRF.
