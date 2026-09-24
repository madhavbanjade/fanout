-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "senderId" TEXT;

-- Backfill: before senderId existed, every notification was assumed self-sent.
-- Rows created by the admin send/broadcast endpoints predate this column and
-- can't be re-attributed retroactively, so they default to the recipient too.
UPDATE "Notification" SET "senderId" = "userId" WHERE "senderId" IS NULL;

-- CreateIndex
CREATE INDEX "Notification_senderId_createdAt_idx" ON "Notification"("senderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
