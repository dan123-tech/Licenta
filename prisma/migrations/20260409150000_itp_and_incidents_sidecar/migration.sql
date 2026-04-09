-- ITP sidecar (works with external cars provider too)
CREATE TABLE IF NOT EXISTS "CarItpMeta" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "itpExpiresAt" TIMESTAMP(3),
  "itpLastNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CarItpMeta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CarItpMeta_companyId_carId_key" ON "CarItpMeta"("companyId", "carId");
CREATE INDEX IF NOT EXISTS "CarItpMeta_companyId_idx" ON "CarItpMeta"("companyId");
CREATE INDEX IF NOT EXISTS "CarItpMeta_itpExpiresAt_idx" ON "CarItpMeta"("itpExpiresAt");

ALTER TABLE "CarItpMeta"
  ADD CONSTRAINT "CarItpMeta_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Incident reports (stored in built-in Postgres)
DO $$ BEGIN
  CREATE TYPE "IncidentSeverity" AS ENUM ('A', 'B', 'C');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IncidentStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "IncidentReport" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reservationId" TEXT,
  "occurredAt" TIMESTAMP(3),
  "severity" "IncidentSeverity" NOT NULL DEFAULT 'C',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "status" "IncidentStatus" NOT NULL DEFAULT 'SUBMITTED',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IncidentReport_companyId_createdAt_idx" ON "IncidentReport"("companyId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "IncidentReport_companyId_status_idx" ON "IncidentReport"("companyId", "status");
CREATE INDEX IF NOT EXISTS "IncidentReport_companyId_carId_idx" ON "IncidentReport"("companyId", "carId");
CREATE INDEX IF NOT EXISTS "IncidentReport_userId_idx" ON "IncidentReport"("userId");

ALTER TABLE "IncidentReport"
  ADD CONSTRAINT "IncidentReport_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IncidentReport"
  ADD CONSTRAINT "IncidentReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "IncidentAttachment" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "contentType" TEXT,
  "sizeBytes" INTEGER,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IncidentAttachment_incidentId_createdAt_idx" ON "IncidentAttachment"("incidentId", "createdAt" DESC);

ALTER TABLE "IncidentAttachment"
  ADD CONSTRAINT "IncidentAttachment_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

