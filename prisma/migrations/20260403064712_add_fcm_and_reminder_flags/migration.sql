-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "pushReminderEndSentAt" TIMESTAMP(3),
ADD COLUMN     "pushReminderStartSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fcmToken" TEXT,
ADD COLUMN     "fcmTokenUpdatedAt" TIMESTAMP(3);
