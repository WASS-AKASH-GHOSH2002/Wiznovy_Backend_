import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AdminAuditInterceptor } from '../interceptors/admin-audit.interceptor';

export function AdminProtected() {
  return applyDecorators(
    UseInterceptors(AdminAuditInterceptor),
  );
}