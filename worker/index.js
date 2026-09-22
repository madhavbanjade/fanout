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
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await publisher.publish(
      `user:${notification.userId}:notifications`,
      JSON.stringify(notification),
    );
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: "DELIVERED" },
    });
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
