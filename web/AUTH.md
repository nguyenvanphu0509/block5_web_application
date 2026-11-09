# SPA + API authentication

Login/signup retain the original CSS, layout, social icons, banner and carousel.
Signup checks password confirmation on the initial form, then continues to CAPTCHA and OTP. Social buttons report that
linked login is not configured. Passwords are never prefilled or persisted.

## Responsibilities

The SPA calls the API, saves the access token, sends Authorization: Bearer, and
handles errors/session expiry. The API checks password hashes and activated
accounts, delivers/checks OTP, handles resets, verifies CAPTCHA and rate limits.

`api/src/auth/jwt.js` signs/verifies HS256 access tokens and checks issuer,
audience, subject, role, issued-at and expiry. This module imports only
`node:crypto`: it has no database dependency. Authentication and role middleware
perform zero database queries. `/api/auth/me` returns verified claims without
looking up a user. Resource handlers may then read/write business data.

JWTs last 15 minutes. Stateless verification means password/role/account changes
cannot revoke an existing token immediately; its signed claims remain effective
until expiry. Logout removes the local token. Reset removes the current browser
session and invalidates SSR database sessions, but other JWTs expire naturally.

## Routes

All POST routes accept JSON and return `{ ok: true, data: ... }` or
`{ ok: false, error: { code, message, fields? } }`.

| POST endpoint | Body |
| --- | --- |
| `/api/auth/login` | `email, password, g-recaptcha-response?` |
| `/api/auth/register` | `email, name, password, confirmPassword, g-recaptcha-response` |
| `/api/auth/activate` | `email, otp` |
| `/api/auth/activate/resend` | `email` |
| `/api/auth/forgot` | `email` |
| `/api/auth/reset` | `token, password, confirmPassword` |

Login returns `data.accessToken`, `data.expiresIn`, `data.user`. Registration is
always `viewer` regardless of submitted role. Passwords use the SSR-compatible
scrypt format. OTPs expire in 10 minutes, with a 60-second resend cooldown and
15-minute lock after five failures. Reset tokens are hashed, single-use and
expire in 15 minutes. Forgot-password responses do not reveal account existence.
SMTP acceptance does not guarantee inbox delivery; check spam folders too.

Catalog GETs require a valid token. POST/PATCH require editor or admin, DELETE
requires admin. `/api/config`, `/api/home` and restaurant suggestions are public.
HTTP 401 clears the current SPA session; HTTP 403 retains it and shows the error.
Remember login uses localStorage; otherwise sessionStorage is used.

## Configuration

API `.env`: `JWT_SECRET` (random, >=32 bytes), `AUTH_DATABASE_URL` (defaults to
DATABASE_URL), `AUTH_CHALLENGE_SECRET` (defaults to JWT_SECRET), SMTP_HOST,
SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, RECAPTCHA_SECRET_KEY,
RECAPTCHA_ALLOWED_HOSTNAMES, SPA_ORIGIN.

SPA `.env.local`: `VITE_API_BASE_URL`, public `VITE_RECAPTCHA_SITE_KEY` (v2).
Never put the CAPTCHA secret or JWT signing key in Vite variables.
Production SPA CSP permits the reCAPTCHA script/frame endpoints.

```sh
npm --prefix api run auth:migrate
# Optional new administrator; existing accounts are not modified:
# Set API_SEED_EMAIL and API_SEED_PASSWORD, then:
npm --prefix api run auth:seed
npm run dev
```

The additive migration uses the existing SSR `block8_auth` schema. Set
AUTH_DATABASE_URL to that database and AUTH_CHALLENGE_SECRET to the SSR session
secret to share both accounts and OTP challenges. Migration does not drop tables,
reset passwords, promote existing accounts or delete data.

Background resend/reset email jobs are in-process. Graceful shutdown drains them;
an abrupt termination may require the user to request another email.

## Checks

```sh
node --test tests/api-auth.test.js tests/api.test.js tests/frontend.test.js web/tests/auth.test.js
npm --prefix web run build
# Full SPA/API browser flow: in-memory SQL, fake SMTP and CAPTCHA, real HTTP API:
VITE_API_BASE_URL=http://localhost:3189 VITE_RECAPTCHA_SITE_KEY=test-public-key npm --prefix web run dev -- --port 5179
# In another terminal, with Chrome installed:
node web/tests/auth.integration.browser.js
```

`tests/api-auth.test.js` explicitly fails on any database access during JWT/role
verification, including missing/invalid tokens and a simulated database outage.
