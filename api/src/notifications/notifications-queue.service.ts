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
      'deliver',
      { notificationId },
      {
        jobId: notificationId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }
}
