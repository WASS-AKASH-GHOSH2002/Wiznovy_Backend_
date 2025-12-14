import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Account } from 'src/account/entities/account.entity';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext): Account => {
    const req = context.switchToHttp().getRequest();
    return req.user;
  },
);
