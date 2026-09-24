// @ts-nocheck
// api create the notifications and worker consumes it.

import "dotenv/config";
import prismaPackage from "@prisma/client";
import { Worker } from "bullmq";
import IORedis from "ioredis";

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const publisher = new IORedis(process.env.REDIS_URL);
const worker = new Worker('notifications', async (job) => {

  const { notificationId } = job.data;
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

  if (!notification || notification.status === 'DELIVERED') {
    console.log(`Skipping ${notificationId} — already delivered or missing`);
    return;
  }

  try {
    // This test user always fails so BullMQ exercises all configured retries.
    if (notification.userId === 'test-fail-user') {
      throw new Error('Simulated delivery failure');
    }

    // @ts-ignore
    await publisher.publish(
      `user:${notification.userId}:notifications`,
      JSON.stringify(notification),
    );

    await prisma.$transaction([
      prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'DELIVERED' },
      }),
      prisma.deliveryAttempt.create({
        data: {
          notificationId,
          attemptNumber: job.attemptsMade + 1,
          succeeded: true,
        },
      }),
    ]);

    console.log(`Delivered notification ${notificationId} to user ${notification.userId}`);
  } catch (err) {
    const attemptNumber = job.attemptsMade + 1;
    const isFinalAttempt = attemptNumber >= (job.opts.attempts ?? 1);
    const errorMessage = err instanceof Error ? err.message : String(err);

    await prisma.$transaction([
      prisma.deliveryAttempt.create({
        data: {
          notificationId,
          attemptNumber,
          succeeded: false,
          error: errorMessage,
        },
      }),
      ...(isFinalAttempt
        ? [
            prisma.notification.update({
              where: { id: notificationId },
              data: { status: 'DEAD_LETTER' },
            }),
          ]
        : []),
    ]);

    if (isFinalAttempt) {
      console.error(`Notification ${notificationId} moved to DEAD_LETTER`);
    }
    throw err; // re-throw so BullMQ still retries
  }
}, { connection });
worker.on('failed', async (job, err) => {
  console.error(`Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);

});


//the API creates a job that BullMQ stores in Redis (not delivered, just waiting); the worker pulls it, checks the database, then publishes it to Redis again — this time as a live broadcast — which the gateway picks up and pushes to the browser.
