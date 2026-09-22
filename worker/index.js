// @ts-check
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
const worker = new Worker(
  "notifications",
  async (job) => {
    const { notificationId } = job.data;
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.status === "DELIVERED") {
      console.log(`Skipping ${notificationId} — already delivered or missing`);
      return;
    }
    console.log(`Processing notification ${notificationId}`);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    // Persist the terminal state first, then publish that same state to the UI.
    // Publishing `notification` here would send the stale PENDING object read
    // above, leaving the browser with no way to show the status transition.
    const deliveredNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "DELIVERED" },
    });
    await publisher.publish(
      `user:${notification.userId}:notifications`,
      JSON.stringify(deliveredNotification),
    );
    console.log(
      `Delivered notification ${notificationId} to user ${notification.userId}`,
    );
  },
  { connection },
);
worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
console.log("Worker started, listening for jobs...");


//the API creates a job that BullMQ stores in Redis (not delivered, just waiting); the worker pulls it, checks the database, then publishes it to Redis again — this time as a live broadcast — which the gateway picks up and pushes to the browser.
