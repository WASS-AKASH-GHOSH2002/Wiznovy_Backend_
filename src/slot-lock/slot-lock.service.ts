import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class SlotLockService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async acquireSlotLock(tutorId: string, sessionDate: string, startTime: string, userId: string): Promise<boolean> {
    const lockKey = `slot_lock:${tutorId}:${sessionDate}:${startTime}`;
    const lockValue = `${userId}:${Date.now()}`;
    
    
    const result = await this.redis.set(lockKey, lockValue, 'EX', 300, 'NX');
    return result === 'OK';
  }

  async releaseSlotLock(tutorId: string, sessionDate: string, startTime: string): Promise<void> {
    const lockKey = `slot_lock:${tutorId}:${sessionDate}:${startTime}`;
    await this.redis.del(lockKey);
  }

  async isSlotLocked(tutorId: string, sessionDate: string, startTime: string): Promise<boolean> {
    const lockKey = `slot_lock:${tutorId}:${sessionDate}:${startTime}`;
    const lockValue = await this.redis.get(lockKey);
    return !!lockValue;
  }

  async verifyUserLock(tutorId: string, sessionDate: string, startTime: string, userId: string): Promise<boolean> {
    const lockKey = `slot_lock:${tutorId}:${sessionDate}:${startTime}`;
    const lockValue = await this.redis.get(lockKey);
    return lockValue?.startsWith(`${userId}:`) || false;
  }
}