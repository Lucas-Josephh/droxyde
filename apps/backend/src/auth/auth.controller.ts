import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import type { AuthResponse, SessionInfo } from '@droxyde/types';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthedRequest, SessionGuard } from './guards/session.guard';
import { SessionService } from './session.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and open a session' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const user = await this.auth.register(dto);
    await this.sessions.create(user, res, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    return { user: UsersService.toPublic(user) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email + password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const user = await this.auth.validateCredentials(dto);
    await this.sessions.create(user, res, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    return { user: UsersService.toPublic(user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(
    @Req() req: AuthedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.revoke(req.sessionId, res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated user, if any' })
  async me(@Req() req: Request): Promise<SessionInfo> {
    const sessionId = req.signedCookies?.[this.sessions.cookieName];
    if (!sessionId || typeof sessionId !== 'string') {
      return { authenticated: false, user: null };
    }
    const session = await this.sessions.findValid(sessionId);
    if (!session) return { authenticated: false, user: null };
    return { authenticated: true, user: UsersService.toPublic(session.user) };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete the authenticated user and all their sessions' })
  async deleteAccount(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.sessions.revokeAllForUser(user.id);
    // Sessions cascade-delete via the User → Session relation.
    await this.users.delete(user.id);
    res.clearCookie(this.sessions.cookieName, { path: '/' });
  }
}
