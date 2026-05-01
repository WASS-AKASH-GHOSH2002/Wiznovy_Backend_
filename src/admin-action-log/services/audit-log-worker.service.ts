import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';
import { AdminActionLogService } from '../admin-action-log.service';
import { UserDetail } from '../../user-details/entities/user-detail.entity';
import { TutorDetail } from '../../tutor-details/entities/tutor-detail.entity';
import { AdminActionType } from '../../enum';

@Injectable()
export class AuditLogWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly QUEUE_KEY = 'audit_logs_queue';
  private isRunning = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly adminActionLogService: AdminActionLogService,
    @InjectRepository(UserDetail) private readonly userDetailRepo: Repository<UserDetail>,
    @InjectRepository(TutorDetail) private readonly tutorDetailRepo: Repository<TutorDetail>,
  ) {}

  async onModuleInit() {
    if (this.redis.status !== 'ready') {
      console.error('❌ Redis is not ready! Admin logs will NOT be saved!');
      return;
    }
    this.isRunning = true;
    setImmediate(() => this.startWorker());
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
          auditData.description = await this.resolveDescription(auditData);
          await this.adminActionLogService.create(auditData);
        }
      } catch (error) {
        console.error('❌ Audit worker error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async resolveDescription(auditData: any): Promise<string> {
    const { actionType, targetType, targetId, newData } = auditData;
    const resource = targetType ? this.humanize(targetType) : 'resource';

    // Try to resolve a meaningful identity label from the target
    const identity = await this.resolveIdentity(targetType, targetId, newData);
    const identityStr = identity ? ` ${identity}` : (targetId ? ` (ID: ${targetId})` : '');
    const statusStr = newData?.status ? ` to ${newData.status}` : '';

    const templates: Partial<Record<AdminActionType, string>> = {
      [AdminActionType.CREATE]:               `Created new ${resource}${identityStr}`,
      [AdminActionType.UPDATE]:               `Updated ${resource}${identityStr}`,
      [AdminActionType.DELETE]:               `Deleted ${resource}${identityStr}`,
      [AdminActionType.APPROVE]:              `Approved ${resource}${identityStr}`,
      [AdminActionType.REJECT]:               `Rejected ${resource}${identityStr}`,
      [AdminActionType.SUSPEND]:              `Suspended ${resource}${identityStr}`,
      [AdminActionType.ACTIVATE]:             `Activated ${resource}${identityStr}`,
      [AdminActionType.LOGIN]:                `Admin logged in`,
      [AdminActionType.LOGOUT]:               `Admin logged out`,
      [AdminActionType.COURSE_APPROVED]:      `Approved course${identityStr}`,
      [AdminActionType.COURSE_REJECTED]:      `Rejected course${identityStr}`,
      [AdminActionType.COURSE_UPDATED]:       `Updated course${identityStr}`,
      [AdminActionType.PAYOUT_PROCESSED]:     `Processed payout${identityStr}`,
      [AdminActionType.USER_UPDATED]:         `Updated user${identityStr}`,
      [AdminActionType.USER_STATUS_CHANGED]:  `Changed user status${identityStr}${statusStr}`,
      [AdminActionType.TUTOR_UPDATED]:        `Updated tutor${identityStr}`,
      [AdminActionType.TUTOR_STATUS_CHANGED]: `Changed tutor status${identityStr}${statusStr}`,
      [AdminActionType.STAFF_CREATED]:        `Created staff account${identityStr}`,
      [AdminActionType.STAFF_UPDATED]:        `Updated staff account${identityStr}`,
      [AdminActionType.SESSION_CANCELLED]:    `Cancelled session${identityStr}`,
    };

    return templates[actionType] ?? `Performed ${actionType} on ${resource}${identityStr}`;
  }

  /**
   * Resolves a human-readable identity string for the target.
   * - For user accounts  → "John Doe (WIZ_STU_20260315/0037)"
   * - For tutor accounts → "Sarah Khan (WIZ_TUT_20260220/1032)"
   * - Falls back to name/email from body if no DB record found
   */
  private async resolveIdentity(
    targetType: string | null,
    targetId: string | null,
    body: any,
  ): Promise<string | null> {
    if (!targetId) {
      // No targetId — try to get something useful from the request body
      const name = body?.name || body?.email || body?.title || null;
      return name ? `"${name}"` : null;
    }

    const lowerType = (targetType ?? '').toLowerCase();

    // Tutor-related target types
    if (
      lowerType.includes('tutor') ||
      lowerType === 'tutor-payout' ||
      lowerType === 'tutor-details'
    ) {
      const tutor = await this.tutorDetailRepo.findOne({
        where: [{ accountId: targetId }, { id: targetId }],
        select: ['name', 'tutorId'],
      });
      if (tutor) {
        const parts = [tutor.name, tutor.tutorId].filter(Boolean);
        return parts.length ? `"${parts.join(' - ')}"` : null;
      }
    }

    // User / account / staff / session target types — try userDetail first
    if (
      lowerType.includes('account') ||
      lowerType.includes('user') ||
      lowerType.includes('staff') ||
      lowerType.includes('session')
    ) {
      const user = await this.userDetailRepo.findOne({
        where: { accountId: targetId },
        select: ['name', 'userId'],
      });
      if (user) {
        const parts = [user.name, user.userId].filter(Boolean);
        return parts.length ? `"${parts.join(' - ')}"` : null;
      }

      // Could be a tutor account — fall back to tutorDetail
      const tutor = await this.tutorDetailRepo.findOne({
        where: { accountId: targetId },
        select: ['name', 'tutorId'],
      });
      if (tutor) {
        const parts = [tutor.name, tutor.tutorId].filter(Boolean);
        return parts.length ? `"${parts.join(' - ')}"` : null;
      }
    }

    // For all other resource types just use name/title from body if present
    const name = body?.name || body?.title || body?.email || null;
    return name ? `"${name}"` : `(ID: ${targetId})`;
  }

  private humanize(str: string): string {
    return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
