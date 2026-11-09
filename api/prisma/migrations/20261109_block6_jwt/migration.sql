CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

ALTER TABLE "dishes" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';

ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "chefId" INTEGER;
CREATE INDEX "users_chefId_idx" ON "users"("chefId");
ALTER TABLE "users" ADD CONSTRAINT "users_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "chefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "account_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_tokens_tokenHash_key" ON "account_tokens"("tokenHash");
CREATE INDEX "account_tokens_userId_purpose_idx" ON "account_tokens"("userId", "purpose");
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
