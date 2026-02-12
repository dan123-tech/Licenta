-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "defaultKmUsage" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "releasedExceededReason" TEXT,
ADD COLUMN     "releasedKmUsed" INTEGER;
