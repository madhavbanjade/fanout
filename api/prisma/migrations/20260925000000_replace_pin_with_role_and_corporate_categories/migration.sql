-- Drop the per-user admin PIN in favor of a single explicit role column.
ALTER TABLE "User" DROP COLUMN "adminPinHash";
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'EMPLOYEE';

-- The very first registered account becomes the company admin ("top man") —
-- there is exactly one admin, everyone else is an employee.
UPDATE "User" SET "role" = 'ADMIN'
WHERE id = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1);

-- Swap the e-commerce-flavored preference categories for real corporate ones.
ALTER TABLE "NotificationPreference" DROP COLUMN "comments";
ALTER TABLE "NotificationPreference" DROP COLUMN "newFollowers";
ALTER TABLE "NotificationPreference" DROP COLUMN "orderShipped";
ALTER TABLE "NotificationPreference" DROP COLUMN "orderDelivered";
ALTER TABLE "NotificationPreference" DROP COLUMN "orderDelayed";
ALTER TABLE "NotificationPreference" DROP COLUMN "systemUpdates";

ALTER TABLE "NotificationPreference" ADD COLUMN "taskAssigned" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN "taskUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN "leaveUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN "meetingUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NotificationPreference" ADD COLUMN "announcements" BOOLEAN NOT NULL DEFAULT true;
