# Nhật ký lỗi xác thực SSR — Block 8

Ngày tổng hợp: 02/11/2026. Phạm vi: Express/EJS trong legacy; không sửa SPA React. Tài liệu không chứa mật khẩu, OTP, reset token, cookie hay credential SMTP và không cần mở file .env.

Các mức bằng chứng: **đã tái hiện** là có kiểm thử hoặc quan sát thực tế; **xác nhận từ code** là nhánh xử lý sai có thể chỉ ra trực tiếp; **phòng ngừa** là đã gia cố nhưng chưa chứng minh đó là nguyên nhân sự cố người dùng gặp. Không coi mọi thông báo đăng nhập thất bại là một lỗi hệ thống.

## 1. Đăng ký xong nhưng gửi lại báo sai CAPTCHA

- Hiện tượng: tài khoản có thể đã được tạo nhưng lần gửi tiếp theo báo CAPTCHA không hợp lệ.
- Nguyên nhân xác nhận từ code: POST /register trước đây render form OTP ngay trên URL /register. Refresh hoặc gửi hai lần có thể lặp POST với challenge đã dùng. CAPTCHA một lần dùng từ chối lần thứ hai là đúng; lỗi nằm ở luồng điều hướng/gửi form.
- Cách sửa: đăng ký hợp lệ trả 303 /activate; trang OTP được tải bằng GET. Khóa nút gửi ngay khi submit để chống bấm hai lần. Trang khôi phục từ bộ nhớ trình duyệt được tải lại để lấy challenge mới.
- Bằng chứng: test HTTP kiểm tra 303 và GET OTP nhiều lần không tạo thêm user/email; Chrome bấm hai lần chỉ tạo một POST. Không khẳng định đây là nguyên nhân duy nhất của mọi lần CAPTCHA sai trước đây.
- Mã: src/auth/index.js; public/js/auth.js; tests/flow.test.js.

## 2. CAPTCHA có thể lệch ảnh/mã khi tải chậm hoặc người dùng dán khoảng trắng

- Hiện tượng có thể xảy ra: người dùng đọc ảnh cũ khi challenge ID đã đổi, hoặc nhập đúng ký tự nhưng có khoảng trắng đầu/cuối.
- Nguyên nhân: code ban đầu gán src ảnh và challenge ID ngay sau khi nhận JSON, không chờ ảnh mới tải xong; backend không trim đáp án.
- Cách sửa: vô hiệu hóa nhập/gửi trong lúc tải, chờ Image.decode thành công rồi mới công bố ảnh và ID tương ứng; chuẩn hóa đáp án bằng trim và chuyển chữ hoa. Chỉ mở lại form khi ảnh đã sẵn sàng.
- Bằng chứng: test Chrome đợi ảnh thật tải xong, nhập đáp án chữ thường có khoảng trắng rồi đăng ký thành công. Đây là gia cố phòng ngừa; chưa đo được một lần nhập của người dùng để kết luận chính xác họ gặp race ảnh hay khoảng trắng.
- Mã: public/js/auth.js; src/auth/index.js; tests/flow.test.js.

## 3. Màn hình OTP không tách biệt với bước đăng ký

- Hiện tượng: chuyển nội dung nhưng URL vẫn là /register, khó biết tài khoản đang chờ xác minh hay đã hoàn tất.
- Nguyên nhân: dùng lại trang auth chung nhưng chưa tổ chức rõ trạng thái và điều hướng.
- Cách sửa: trang /activate riêng với tiến trình Đăng ký → Xác minh email → Đăng nhập; giữ email đăng ký trong phiên, ô OTP 6 số, mô tả hạn 10 phút, hướng dẫn kiểm tra spam và gửi lại đếm ngược 60 giây. OTP đúng trả 303 /login với thông báo thành công. Không tự đăng nhập sau kích hoạt theo yêu cầu bài.
- Bằng chứng: ảnh otp-mobile.png và otp-desktop.png trong artifacts; test HTTP/Chrome đi hết luồng, pending bị chặn và active mới đăng nhập được.
- Mã: src/views/auth/index.ejs; public/js/auth.js; public/css/auth.css; tests/flow.test.js.

## 4. Đổi mật khẩu bị trang trắng Forbidden — lỗi đã tái hiện trên Chrome

- Hiện tượng: gửi mật khẩu mới từ trang reset nhận HTTP 403 và chữ Forbidden. Không có bằng chứng mật khẩu được đổi trong request bị chặn này.
- Nguyên nhân: GET /reset đặt Referrer-Policy: no-referrer để tránh lộ token trong Referer. Trong thử nghiệm Chrome, native POST từ trang này mang Origin: null. Middleware cũ so Origin với origin website rồi từ chối trước khi xử lý reset.
- Cách sửa: chỉ riêng /reset được chấp nhận Origin: null khi Sec-Fetch-Site là same-origin và CSRF token khớp phiên. Origin lạ, null/cross-site hoặc sai CSRF vẫn bị chặn. Không tắt bảo vệ CSRF hay bỏ no-referrer.
- Bằng chứng trước sửa: test Chrome nhận đúng 403 và ghi nhận Origin: null. Sau sửa, POST hợp lệ thành công; các request giả mạo vẫn 403, password/token không đổi.
- Mã: src/auth/index.js; tests/flow.test.js.

## 5. Reset thành công nhưng form đăng nhập vẫn ở URL /reset

- Nguyên nhân xác nhận từ code: POST /reset render trực tiếp chế độ login thay vì chuyển hướng tới GET /login; trình duyệt vẫn ở trang POST/reset với chính sách no-referrer. Refresh cũng có thể lặp yêu cầu reset đã dùng.
- Cách sửa: reset thành công thu hồi session của user, tạo sid/CSRF mới cho phiên ẩn danh, lưu thông báo rồi trả 303 /login. Không tự đăng nhập. Dùng lại token bị từ chối.
- Bằng chứng: Chrome đổi mật khẩu → /login → đăng nhập được bằng mật khẩu mới; HTTP test xác nhận token dùng một lần, password cũ không còn khớp và version user tăng.
- Mã: src/auth/index.js; tests/flow.test.js; tests/auth.test.js.

## 6. SMTP lỗi nhưng giao diện vẫn khiến người dùng tưởng đã gửi email

- Nguyên nhân xác nhận từ code: send() cũ catch mọi lỗi, chỉ log một dòng rồi trả về như thành công. Logic gọi không phân biệt SMTP chấp nhận và từ chối.
- Cách sửa: tách mail sender, ném MailDeliveryError khi gửi thất bại; kiểm tra cả trường hợp không có người nhận nào được SMTP chấp nhận. Log chỉ gồm code an toàn, responseCode và số lần thử. Giao diện dùng thông báo chung, không khẳng định thư chắc chắn đã đến Inbox.
- Bằng chứng: giả lập EAUTH và accepted=[]; xác nhận lỗi được nhận diện, không log credential, địa chỉ nhận hay OTP. Trong kiểm tra thật sau sửa, Gmail nhận cả thư đầu và thư gửi lại vào Inbox.
- Giới hạn: không đọc cấu hình .env để xác định lỗi SMTP lịch sử của người dùng là EAUTH, timeout hay nguyên nhân khác. Test EAUTH là lỗi cố ý giả lập, không phải kết luận SMTP thật bị sai mật khẩu.
- Mã: src/auth/mail.js; src/auth/index.js; tests/delivery.test.js.

## 7. SMTP lỗi tạm thời không có thử lại tự động

- Nguyên nhân: trước đây chỉ gửi một lần; lỗi mạng hoặc SMTP 4xx làm luồng gửi kết thúc ngay.
- Cách sửa: thử lại tối đa một lần sau 250 ms với cùng một nội dung/mã. Không lặp lại vô hạn và không retry lỗi xác thực vĩnh viễn. Email trùng do trạng thái giao nhận không rõ vẫn có cùng OTP, không sinh hai mã mâu thuẫn.
- Bằng chứng: test lần đầu ECONNRESET, lần hai thành công; cả hai dùng cùng nội dung. Permanent EAUTH không được retry.
- Giới hạn: SMTP chấp nhận không đảm bảo Gmail giao ngay vào Inbox; vẫn có spam, chậm giao hoặc sự cố nhà cung cấp.
- Mã: src/auth/mail.js; tests/delivery.test.js.

## 8. Đăng ký lại email pending không gửi OTP mới

- Nguyên nhân xác nhận từ code: chỉ gọi gửi OTP khi INSERT tạo được user mới. ON CONFLICT DO NOTHING khiến user pending cũ không nhận mã qua lần đăng ký lại, kể cả lần gửi trước đã thất bại.
- Cách sửa: sau bước đăng ký, kiểm tra trạng thái hiện có trong transaction. Pending có thể nhận mã sau cooldown, nếu chưa bị khóa; active không nhận OTP kích hoạt. Không tạo trùng user và không ghi đè password cũ.
- Bằng chứng: test SMTP lần đầu thất bại → user vẫn pending → đăng ký lại cùng email gửi được mã. Dùng password khác trong lần đăng ký lại không thay password đã lưu. Trong cooldown không gửi thêm.
- Mã: src/auth/activation.js; src/auth/index.js; tests/delivery.test.js.

## 9. Gửi lại OTP thất bại làm mã cũ mất hiệu lực

- Nguyên nhân xác nhận từ code: code cũ thay otpHash và hạn trước khi gửi SMTP, rồi bỏ qua lỗi gửi. Người dùng chỉ có mã cũ nhưng database đã chuyển sang mã mới chưa nhận được.
- Cách sửa: khóa user/challenge cùng transaction, kiểm tra khóa và cooldown, gửi mã trước khi thay hash/hạn. SMTP từ chối thì không thay mã cũ, hạn, attempts hoặc mốc gửi. Khi gửi thành công mới thay mã; attempts không reset bởi resend.
- Bằng chứng: fake SMTP thất bại xác nhận hash, expiresAt và attempts cũ được giữ; lần gửi thành công tiếp theo thay hash và vẫn giữ attempts.
- Giới hạn: SMTP và PostgreSQL không thuộc một transaction phân tán. Nếu SMTP đã nhận nhưng database commit thất bại, vẫn cần yêu cầu gửi lại; không tuyên bố bảo đảm giao thư exactly-once.
- Mã: src/auth/activation.js; tests/delivery.test.js.

## 10. Gửi link quên mật khẩu thất bại có thể vô hiệu hóa link cũ

- Nguyên nhân xác nhận từ code: tương tự OTP, trước đây cập nhật token reset trong DB rồi mới gọi gửi thư.
- Cách sửa: trong transaction khóa user, gửi thư trước rồi mới tiêu thụ token cũ và lưu hash token mới. SMTP từ chối thì giữ link cũ; nội dung/status trả về vẫn chung cho email có và không có tài khoản.
- Bằng chứng: test thư thất bại giữ usedAt của link cũ là null; thư được chấp nhận mới đánh dấu link cũ và tạo bản ghi mới.
- Mã: src/auth/index.js; tests/delivery.test.js.

## 11. Yêu cầu mật khẩu chưa hiển thị rõ

- Hiện tượng: người dùng không biết hệ thống yêu cầu 15–128 ký tự và khoảng trắng có được tính hay không.
- Nguyên nhân: đã có validation backend và minlength/maxlength nhưng thiếu hướng dẫn cạnh trường nhập.
- Cách sửa: bổ sung mô tả ở trang đăng ký/reset: 15–128 ký tự, phân biệt hoa/thường, khoảng trắng được tính; không tự trim password. Đăng nhập không bắt buộc nhập lại theo chính sách tạo password mới, chỉ kiểm tra với hash đã lưu.
- Giới hạn: không có bằng chứng để kết luận tài khoản active từng bị đăng nhập lỗi là do độ dài, sai password hay đăng ký lại email. Không được ghi báo cáo rằng password hash bị sai nếu chưa chứng minh.
- Mã: src/views/auth/index.ejs; src/auth/crypto.js.

## 12. Chèn CSRF làm hỏng thẻ form EJS trong lúc triển khai

- Hiện tượng quan sát khi đọc diff: hidden input CSRF bị chèn vào giữa giá trị enctype của form multipart.
- Nguyên nhân: regex đơn giản tìm dấu > đầu tiên, nhưng trong thẻ có biểu thức EJS kết thúc bằng %>.
- Cách sửa: phục hồi markup rồi nhận diện/đi qua khối EJS trước khi tìm dấu đóng thẻ; hidden input phải nằm bên trong form sau dấu > thật. Form thường và multipart đều giữ CSRF.
- Bằng chứng: compile template, đọc lại markup và test authenticated POST thường/multipart sai CSRF đều bị chặn trước khi ghi dữ liệu. Đây là lỗi lúc sửa code, không phải lỗi người dùng nhập form.
- Mã: src/views/admin/form.ejs; src/views/admin/delete.ejs; tests/auth.test.js.

## 13. Cách chụp kiểm thử làm ảnh CAPTCHA trông như không tải được

- Hiện tượng trong ảnh QA: khoảng ảnh CAPTCHA trống dù endpoint có phản hồi.
- Nguyên nhân đã xác nhận ở bài QA cũ: chỉ đợi img có src hoặc chờ cố định 800 ms; request ảnh còn chạy nên naturalWidth vẫn 0. Có lần dọn schema test khi request ảnh chưa hoàn tất.
- Cách sửa kiểm thử: chờ naturalWidth > 0 trước khi chụp/đánh giá ảnh. Ở UI cũng đã thêm Image.decode trước khi mở nút gửi như mục 2.
- Giới hạn: ảnh chụp quá sớm không chứng minh Gmail/SMTP hay bộ sinh CAPTCHA hỏng.
- Mã: scripts/visual-qa.js; public/js/auth.js; tests/flow.test.js.

## Các trường hợp không phải lỗi đã được chứng minh

| Trường hợp | Giải thích đúng |
|---|---|
| User pending nhập đúng password vẫn không login | Chủ đích: phải xác minh OTP trước. |
| User active đăng ký lại nhưng không nhận OTP kích hoạt | Chủ đích: không tạo trùng, không đổi password cũ, không kích hoạt lần nữa. Trang phản hồi chung vẫn có thể gây nhầm; không có thông báo khẳng định email đã tồn tại vì đề yêu cầu chống dò tài khoản. |
| Email gốc và email +otp-test cùng vào một Gmail | Tính năng plus addressing của Gmail. App hiện coi hai chuỗi email là hai tài khoản khác nhau. Đây là cách kiểm thử, không phải yêu cầu trong slide hay lỗi SMTP. |
| Sai CAPTCHA sau khi dùng lại | Challenge một lần dùng phải bị từ chối; cần xem có bị gửi form lặp do UI hay không. |
| Mở link reset hoặc dùng lại token cũ không đổi được password | GET chỉ hiện form; token đã dùng/hết hạn phải bị từ chối. |
| Thông báo chung 'Thông tin đăng nhập không hợp lệ' ở tài khoản active | Ảnh cho thấy trạng thái active nhưng không chứng minh người dùng gửi đúng password. Không đủ dữ liệu kết luận backend so hash bị lỗi. |
| Báo Missing script dev:ssr khi đang ở legacy | Lệnh dev:ssr thuộc workspace gốc; bên trong legacy dùng npm run dev. Đây là cách chạy, không phải lỗi auth. |

## Lỗi ảnh liên quan giao diện, ngoài logic xác thực

Ảnh Chả cá Lã Vọng thực tế trong HTML dùng URL huongnghiepaau.com, ngoài danh sách img-src của SSR. Ảnh không hiện dù tên món và khung vẫn còn. Đã ánh xạ đúng hai URL cũ đã biết sang ảnh JPEG minh họa lưu riêng trong legacy/public/images, thêm fallback cho các ảnh lỗi và cho danh sách tải thêm. Chrome kiểm tra trang đang chạy xác nhận ảnh local có naturalWidth 640, naturalHeight 480. Không thay URL trong database hay source SPA. Đây không phải lỗi tải ảnh lên từ form.

Một lỗi giao diện khác đã gặp là bộ lọc danh sách tràn ngang ở mobile 390px; đã đổi riêng form SSR sang grid responsive. Không phải lỗi xác thực.

## Vấn đề môi trường kiểm thử, không phải lỗi website

- EPERM khi test HTTP mở cổng localhost trong sandbox: cần quyền chạy kiểm thử localhost, không sửa cơ chế login để né.
- ENOTFOUND khi truy cập PostgreSQL từ sandbox: lỗi quyền mạng/DNS của môi trường test, không chứng minh tài khoản hay database sai.
- Test ban đầu với origin localhost cố định nhưng browser chạy cổng ngẫu nhiên bị 403 đúng theo cấu hình: truyền origin của server test, không tắt kiểm tra nguồn trong production.
- Playwright không đọc được body của response 303: không gọi response.text cho redirect; kiểm tra status, Location và trang GET sau đó.
- Script QA tương tác bị đóng stdin khi không có TTY: dùng phiên terminal giữ stdin; không liên quan SMTP.
- Schema test cũ còn trong Supabase: có thể do test bị ngắt/dọn không hoàn tất; chưa xác minh nguyên nhân từng schema. Không gọi đó là dữ liệu tài khoản thật và không tự xóa schema hệ thống.

## Kiểm tra lại và giới hạn bằng chứng

```sh
npm --prefix legacy run test:flow
```

Tại thời điểm tổng hợp, 7 test cấp cao trong flow.test.js và delivery.test.js đã đạt, bao gồm HTTP, Chrome, SMTP giả lập và ảnh SSR. Test dùng pg-mem, không chứng minh khả năng khóa/rollback đồng thời của PostgreSQL thật; bộ tests/auth.test.js là lớp kiểm thử PostgreSQL riêng. Không đánh đồng test mô phỏng với việc đã kiểm thử mọi tình huống trên môi trường production.

Sau yêu cầu không đọc .env, test:flow được chạy với preload chặn đọc file môi trường, mailer/DB giả lập. Không chạy lại bộ test cần mở cấu hình thật để lấy credential. Kiểm tra thư thật được thực hiện qua website đang chạy và Gmail được kết nối, không mở file cấu hình: đã xác nhận thư OTP lần đầu và một lần gửi lại có trong Inbox của alias do người dùng cho phép; không tự nhập mã để active tài khoản thử và không sửa tài khoản chính.

Ảnh minh chứng trong artifacts (không commit): otp-mobile.png, otp-desktop.png, hero-photo-fixed.png. Không đưa ảnh có OTP/token/password/cookie vào báo cáo. Riêng log SMTP chỉ dùng trường đã được lọc, không chép lỗi/raw response có thể chứa bí mật.

## 

resets — quản lý link đặt lại mật khẩu

Ví dụ bạn bấm “Quên mật khẩu”, server gửi email chứa link có token. Bảng này lưu:
- hash: bản băm SHA-256 của token trong link.
- user_id: link này dành cho tài khoản nào.
- expires_at: thời điểm hết hạn, hiện là 15 phút.
- used_at: thời điểm đã dùng; NULL nghĩa là chưa dùng.
Khi bạn đổi mật khẩu thành công, server cập nhật mật khẩu trong users và đánh dấu token đã dùng trong resets.

limits — đếm số lần thao tác để chống lạm dụng

Các trường gồm:
- key: đang đếm thao tác nào, theo email hoặc IP nào, ví dụ login:email:abc@example.com.
- count: số lần đã ghi nhận.
- started_at: thời điểm bắt đầu khoảng đếm.
- locked_until: bị khóa đến khi nào.
Ví dụ với đăng nhập theo email: sau 3 lần thất bại sẽ yêu cầu CAPTCHA; đạt 10 lần sẽ khóa 15 phút. Bảng này cũng giới hạn đăng ký, quên mật khẩu và gửi lại OTP.

mail_cooldowns — buộc chờ trước khi gửi lại OTP

Hiện bảng này có hai trường:
- key: chẳng hạn activation:abc@example.com.
- available_at: thời điểm được phép yêu cầu gửi lại.
Ví dụ bạn yêu cầu lúc 10:00:00, hệ thống ghi thời điểm được gửi tiếp là 10:01:00. Bấm lại trong thời gian đó sẽ bị chặn. Khác với limits đếm số lần, bảng này kiểm tra đã chờ đủ 60 giây chưa.

activation — quản lý mã OTP kích hoạt

Lưu tài khoản cần xác minh, bản băm của OTP, hạn 10 phút, số lần nhập sai và thời điểm đã dùng. Nhập đúng thì users.status chuyển từ pending sang active.

session — giữ trạng thái của trình duyệt

Có sid là mã phiên, sess chứa dữ liệu như userId, mã CSRF, và expire là thời điểm hết hạn. Cookie sid trên trình duyệt giúp server tìm đúng dòng ở bảng này. Phiên có thể tồn tại trước khi đăng nhập để giữ mã CSRF.

captcha trong ảnh là bảng của cách làm CAPTCHA cũ. Code hiện tại dùng Google reCAPTCHA và file migration hiện đã có lệnh bỏ bảng này. Chỉ từ ảnh thì chưa xác định được database đã cập nhật migration mới hay chưa.

  
