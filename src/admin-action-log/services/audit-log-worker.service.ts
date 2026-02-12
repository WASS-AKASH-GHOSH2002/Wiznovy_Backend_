import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';
import { AdminActionLogService } from '../admin-action-log.service';

@Injectable()
export class AuditLogWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly QUEUE_KEY = 'audit_logs_queue';
  private isRunning = false;

  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    private adminActionLogService: AdminActionLogService,
  ) {}

  async onModuleInit() {
    this.isRunning = true;
    this.startWorker();
  }

  async onModuleDestroy() {
    this.isRunning = false;
  }

  private async startWorker() {
    while (this.isRunning) {
      try {
        const result = await this.redis.brpop(this.QUEUE_KEY, 5);
        
        if (result) {
          const [, data] = result;
          const auditData = JSON.parse(data);
          await this.adminActionLogService.create(auditData);
        }
      } catch (error) {
        console.error('❌ Worker error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}