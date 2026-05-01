import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AdminActionLog } from './entities/admin-action-log.entity';
import { AdminActionType,  } from 'src/enum';
import { AdminActionLogQueryDto } from './dto/admin-action-log.dto';
import { buildCsv, formatCsvDate, CsvColumn } from '../utils/csv.utils';

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
    try {
      const log = this.logRepo.create(auditData);
      const saved = await this.logRepo.save(log);
      return saved;
    } catch (error) {
      console.error('❌ Failed to save admin log:', error.message);
      throw error;
    }
  }

  async findAll(query: AdminActionLogQueryDto) {
    const { limit = 20, offset = 0, adminId, targetType, targetId, startDate, endDate } = query;
    
    const queryBuilder = this.logRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .select([
        'log.id',
        'log.adminId',
        'log.actionType',
        'log.targetId',
        'log.targetType',
        'log.role',
        'log.description',
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

    if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: end });
    }

    const [result, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();
       
    return { result, total};
  }

  async exportCsv(query: AdminActionLogQueryDto): Promise<string> {
    const { adminId, targetType, targetId, startDate, endDate } = query;

    const queryBuilder = this.logRepo.createQueryBuilder('log')
      .leftJoin('log.admin', 'admin')
      .select([
        'log.id',
        'log.actionType',
        'log.targetType',
        'log.description',
        'log.ipAddress',
        'log.role',
        'log.createdAt',
        'admin.email',
        'admin.roles',
      ]);

    if (adminId) queryBuilder.andWhere('log.adminId = :adminId', { adminId });
    if (targetType) queryBuilder.andWhere('log.targetType = :targetType', { targetType });
    if (targetId) queryBuilder.andWhere('log.targetId = :targetId', { targetId });
    if (startDate) queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: new Date(startDate) });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: end });
    }

    const records = await queryBuilder.orderBy('log.createdAt', 'DESC').getMany();

    const columns: CsvColumn[] = [
      { header: 'Admin Email',  value: (r) => r.admin?.email ?? '' },
      { header: 'Role',         value: (r) => r.role ?? r.admin?.roles ?? '' },
      { header: 'Action',       value: (r) => r.actionType },
      { header: 'Target Type',  value: (r) => r.targetType ?? '' },
      { header: 'Description',  value: (r) => r.description ?? '' },
      { header: 'IP',           value: (r) => r.ipAddress ?? '' },
      { header: 'Date',         value: (r) => formatCsvDate(r.createdAt) },
    ];

    return buildCsv(columns, records);
  }
}
