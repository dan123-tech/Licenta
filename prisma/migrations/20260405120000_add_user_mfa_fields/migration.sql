-- Email MFA: optional 6-digit code after password (stored hashed, short TTL).

ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "mfaOtpHash" TEXT;
ALTER TABLE "User" ADD COLUMN "mfaOtpExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "mfaOtpAttempts" INTEGER NOT NULL DEFAULT 0;
