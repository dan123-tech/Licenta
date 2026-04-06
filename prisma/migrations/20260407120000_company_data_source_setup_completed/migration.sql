-- First-time admin data-source setup gate. Existing companies get "completed" at migration time;
-- new companies keep NULL until admin finishes setup (built-in PostgreSQL or external PostgreSQL).

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "dataSourceSetupCompletedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Company" ALTER COLUMN "dataSourceSetupCompletedAt" DROP DEFAULT;
