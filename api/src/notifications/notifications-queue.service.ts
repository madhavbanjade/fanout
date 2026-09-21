import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
@Injectable()
export class NotificationQueueService implements OnModuleInit {
  private queue!: Queue;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL is required');

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('notifications', { connection });
  }
  async enqueue(notificationId: string) {
    await this.queue.add(
      'deliver',  //job name
      { notificationId }, //job payload
      {
        jobId: notificationId,
        //notification's own ID as BullMQ's job ID means calling enqueue() twice with the same notification silently does nothing the second time. BullMQ won't create a duplicate job.
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }
}


//This file is the API's connection to the job queue — it opens a Redis-backed BullMQ queue on startup and gives the rest of the app one method, enqueue(), to drop a notification ID into it so a separate worker can pick it up and deliver it later.

//So the flow is: enqueue() creates a job → it sits in Redis waiting → the worker consumes that job → the worker's callback receives it as the job parameter, reads job.data.notificationId out of it, and processes it.
