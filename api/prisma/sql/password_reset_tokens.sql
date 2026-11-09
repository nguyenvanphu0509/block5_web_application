BEGIN;

CREATE TABLE public.password_reset_tokens (
  id serial PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "tokenHash" varchar(64) NOT NULL UNIQUE CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),
  "tokenVersion" integer NOT NULL,
  "createdAt" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" timestamptz(3) NOT NULL CHECK ("expiresAt" > "createdAt"),
  "usedAt" timestamptz(3)
);

CREATE INDEX "password_reset_tokens_userId_tokenVersion_createdAt_idx"
  ON public.password_reset_tokens ("userId", "tokenVersion", "createdAt");

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_reset_tokens FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.password_reset_tokens_id_seq FROM PUBLIC, anon, authenticated;

COMMIT;
