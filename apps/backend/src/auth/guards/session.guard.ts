import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';

import { SessionService } from '../session.service';

export interface AuthedRequest extends Request {
  user: User;
  sessionId: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const sessionId = req.signedCookies?.[this.sessions.cookieName];

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.sessions.findValid(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    req.user = session.user;
    req.sessionId = session.id;
    return true;
  }
}
