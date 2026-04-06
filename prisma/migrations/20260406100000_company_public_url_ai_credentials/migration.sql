-- Admin-configurable public URL (invites) and encrypted Gemini API key (driving licence AI).

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "publicAppUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "aiCredentials" JSONB;
