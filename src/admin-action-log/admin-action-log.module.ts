
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { AdminActionLog } from './entities/admin-action-log.entity';
import { AdminActionLogService } from './admin-action-log.service';
import { AdminActionLogController } from './admin-action-log.controller';
import { AdminAuditInterceptor } from './interceptors/admin-audit.interceptor';
import { AuditLogWorkerService } from './services/audit-log-worker.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([AdminActionLog]),
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminActionLogController],
  providers: [
    AdminActionLogService,
    AdminAuditInterceptor,
    AuditLogWorkerService,
  ],
  exports: [
    AdminActionLogService,
    AdminAuditInterceptor,
  ],
})
export class AdminActionLogModule {}
