import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AdminActionLog } from './entities/admin-action-log.entity';
import { AdminActionType,  } from 'src/enum';
import { AdminActionLogQueryDto } from './dto/admin-action-log.dto';

@Injectable()
export class AdminActionLogService {
  constructor(
    @InjectRepository(AdminActionLog)
    private readonly logRepo: Repository<AdminActionLog>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async log(
    adminId: string,
    actionType: AdminActionType,
    targetId: string,
    targetType: string,
    newData?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const log = this.logRepo.create({
        adminId,
        actionType,
        targetId,
        targetType,
        newData,
        ipAddress,
        userAgent,
      });
      await this.logRepo.save(log);
    } catch (error) {
      console.error('Failed to create admin log:', error);
    }
  }

  async auditLog(
    adminId: string,
    action: AdminActionType,
    targetId?: string,
    targetType?: string,
    newData?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      console.log(' Manual audit log called:', { adminId, action, targetId, targetType });
      const queueKey = 'audit_queue';
      const auditData = {
        adminId,
        actionType: action,
        targetId,
        targetType,
        newData,
        ipAddress,
        userAgent,
      };
      
      const existingQueue = await this.cacheManager.get<any[]>(queueKey) || [];
      existingQueue.push(auditData);
      await this.cacheManager.set(queueKey, existingQueue, 3600000);
      console.log('Manual audit log queued successfully');
    } catch (error) {
      console.error('Failed to queue manual audit log:', error);
    }
  }

  async create(auditData: any) {
    const log = this.logRepo.create(auditData);
    return await this.logRepo.save(log);
  }

  async findAll(query: AdminActionLogQueryDto) {
    const { limit = 20, offset = 0, adminId, targetType, targetId, date } = query;
    
    const queryBuilder = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .select([
        'log.id',
        'log.adminId',
        'log.actionType',
        'log.targetId',
        'log.targetType',
        'log.role',
        'log.oldData',
        'log.newData',
        'log.ipAddress',
        'log.userAgent',
        'log.createdAt',
        'admin.id',
        'admin.email',
        'admin.roles'
      ]);

    if (adminId) {
      queryBuilder.andWhere('log.adminId = :adminId', { adminId });
    }

    if (targetType) {
      queryBuilder.andWhere('log.targetType = :targetType', { targetType });
    }

    if (targetId) {
      queryBuilder.andWhere('log.targetId = :targetId', { targetId });
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });
    }

    const [result, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
       
    return { result, total};
  }
}
