# CSR authentication — Block 9, slides 1–35

The API accepts JSON and uses JWT Bearer, without session cookies or CSRF tokens.
Login/register/activate/resend/forgot/reset are anonymous, including when the
browser has a previous token. Only successful login of an activated account
returns an access token. Registration always creates a pending Viewer and ignores
role supplied by the client. All activated accounts have identical CRUD access;
MFA and role-based permissions are outside this exercise.

## Responses and routes

Success: `{ok:true,data:...}`. Business errors: HTTP 200 with
`{ok:false,error:{code,message,fields?}}`.

- POST `/api/auth/register`: email, name, password, confirmPassword, captcha.
- POST `/api/auth/activate`: email, otp.
- POST `/api/auth/activate/resend`: email.
- POST `/api/auth/login`: email, password, captcha when required.
- POST `/api/auth/forgot`: email.
- POST `/api/auth/reset`: token, password, confirmPassword.
- GET `/api/auth/me`: authenticated; returns current id, email, name, role.

The legacy `g-recaptcha-response` field is still accepted; new SPA requests use
`captcha`. Business codes include INVALID_CREDENTIALS, ACCOUNT_NOT_ACTIVATED,
CAPTCHA_REQUIRED, INVALID_CAPTCHA, INVALID_OTP, INVALID_RESET_TOKEN,
VALIDATION_FAILED and NOT_FOUND. Rate limits use HTTP 429/RATE_LIMITED and
Retry-After. Missing/invalid tokens use 401/UNAUTHENTICATED; expired tokens use
401/TOKEN_EXPIRED. Infrastructure failures remain 5xx, not login failures.

GET `/api/dishes` and `/api/dishes/:id` are public. Dish writes and all Chef,
Ingredient and Restaurant CRUD require an active account. Config, home,
restaurant suggestions and static images remain public. CORS is restricted to
SPA_ORIGIN and allows Content-Type/Authorization. OPTIONS requires no token.

## JWT, storage and password reset policy

`jose` signs/verifies HS256, issuer, audience, subject and expiration. The crypto
module never reads DB. A separate middleware loads the account from DB using the
verified subject; deleted/pending/inactive accounts receive 401. Current role is
loaded from DB but is informational for this exercise. DB outages return 5xx.

JWT lifetime is 900 seconds, no refresh token. Password changes do not revoke
existing JWTs early; they remain usable until expiration while the account is
active. Logout clears this browser's copies, not copies held elsewhere.

The SPA uses sessionStorage, or localStorage when remember-login is checked.
These are readable by injected JavaScript: neither protects a token from XSS.
React escapes user data; passwords/OTP/reset tokens are not persisted in storage.
The API client attaches tokens only to the configured API, clears stale sessions
on 401, preserves them on 403/network/5xx, and keeps the admin redirect target.
Restored sessions are checked using `/api/auth/me` before granting admin access.

OTP: six digits, stored as keyed hash, ten-minute expiry, 60-second resend wait,
five wrong guesses trigger a 15-minute lock. Reset tokens are random, hashed,
single-use and expire after 15 minutes. Reset GET only renders the SPA form;
POST consumes the token atomically. Registration and forgot-password return
uniform responses for existing/new addresses. Email is scheduled after response;
SMTP acceptance is not proof of inbox delivery. Jobs are in-process and drained
on graceful shutdown; abrupt failure can require a resend.

## Logic reused from Block 8

Shared server-only modules in `shared/server/auth` contain scrypt password hashing,
OTP delivery, email retries/background delivery, CAPTCHA verification and failed
login counters. SSR and API import these modules with their own configuration
and database adapters; SSR retains its HTML/session/CSRF transport. The API adds
JSON error mapping, JWT issuance and active-account middleware. Do not import
these server-only modules into the web bundle.

Secrets remain in server .env files. Existing JWT/SMTP/CAPTCHA configuration is
retained; no signing key rotation or data migration is required for this update.
