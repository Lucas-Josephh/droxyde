import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { User } from '@prisma/client';

import type { AuthedRequest } from '../guards/session.guard';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  return req.user;
});
