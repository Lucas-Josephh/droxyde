import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { Session, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  get cookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME') ?? 'droxyde.sid';
  }

  private get ttlMs(): number {
    const days = Number(this.config.get<string>('SESSION_TTL_DAYS')) || 30;
    return days * 24 * 60 * 60 * 1000;
  }

  private get cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const domain = this.config.get<string>('COOKIE_DOMAIN') || undefined;

    return {
      httpOnly: true,
      // In prod, front and back are on different root domains, so the cookie
      // MUST be SameSite=None + Secure to be sent on cross-site requests.
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      domain,
      path: '/',
      signed: true,
      maxAge: this.ttlMs,
    };
  }

  async create(
    user: User,
    res: Response,
    meta: { userAgent?: string; ip?: string },
  ): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + this.ttlMs),
        userAgent: meta.userAgent?.slice(0, 255) ?? null,
        ipAddress: meta.ip?.slice(0, 45) ?? null,
      },
    });

    res.cookie(this.cookieName, session.id, this.cookieOptions);
    return session;
  }

  findValid(sessionId: string): Promise<(Session & { user: User }) | null> {
    return this.prisma.session
      .findUnique({
        where: { id: sessionId },
        include: { user: true },
      })
      .then((session) => {
        if (!session) return null;
        if (session.expiresAt.getTime() <= Date.now()) return null;
        return session;
      });
  }

  async revoke(sessionId: string, res: Response): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
    res.clearCookie(this.cookieName, { ...this.cookieOptions, maxAge: 0 });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
