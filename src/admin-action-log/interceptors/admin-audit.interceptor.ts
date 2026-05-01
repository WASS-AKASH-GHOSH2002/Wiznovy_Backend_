import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import Redis from 'ioredis';
import { AdminActionType } from 'src/enum';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly QUEUE_KEY = 'audit_logs_queue';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (user.roles !== 'ADMIN' && user.roles !== 'STAFF')) {
      return next.handle();
    }

    const method = request.method;
    const url = request.url;
    const body = request.body;
    const ip = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const actionType = this.mapMethodToAction(method, url);
    const targetType = this.extractTargetType(url);
    const targetId = this.extractTargetId(url, body);

    const auditData = {
      adminId: user.id,
      role: user.roles,
      actionType,
      targetId,
      targetType,
      oldData: null,
      newData: body,
      ipAddress: ip,
      userAgent,
    };

    return next.handle().pipe(
      tap(() => {
        this.queueAuditLog(auditData);
      })
    );
  }

  private mapMethodToAction(method: string, url: string): AdminActionType {
    const lower = url.toLowerCase();
    if (lower.includes('/approve')) return AdminActionType.APPROVE;
    if (lower.includes('/reject')) return AdminActionType.REJECT;
    if (lower.includes('/suspend')) return AdminActionType.SUSPEND;
    if (lower.includes('/activate')) return AdminActionType.ACTIVATE;
    if (lower.includes('/cancel')) return AdminActionType.SESSION_CANCELLED;
    if (lower.includes('/payout')) return AdminActionType.PAYOUT_PROCESSED;
    if (lower.includes('/status')) return AdminActionType.USER_STATUS_CHANGED;
    switch (method) {
      case 'POST':   return AdminActionType.CREATE;
      case 'PUT':
      case 'PATCH':  return AdminActionType.UPDATE;
      case 'DELETE': return AdminActionType.DELETE;
      default:       return AdminActionType.UPDATE;
    }
  }

  private extractTargetId(url: string, body: any): string | null {
    const idMatch = /\/([a-f\d-]{36}|\d+)(?:\/|$)/.exec(url);
    return idMatch ? idMatch[1] : body?.id || null;
  }

  private extractTargetType(url: string): string | null {
    const segments = url.split('/').filter(Boolean);
    const resourceSegment = segments.find(
      s => s !== 'api' && s !== 'v1' && !/^[a-f\d-]{36}$/.test(s) && !/^\d+$/.test(s)
    );
    return resourceSegment || null;
  }

  private async queueAuditLog(auditData: any) {
    try {
      await this.redis.lpush(this.QUEUE_KEY, JSON.stringify(auditData));
    } catch (error) {
      console.error('❌ Failed to queue audit log:', error);
    }
  }
}
