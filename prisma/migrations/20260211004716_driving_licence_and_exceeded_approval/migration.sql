-- CreateEnum
CREATE TYPE "DrivingLicenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExceededApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "releasedExceededStatus" "ExceededApprovalStatus";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "drivingLicenceStatus" "DrivingLicenceStatus",
ADD COLUMN     "drivingLicenceUrl" TEXT;
