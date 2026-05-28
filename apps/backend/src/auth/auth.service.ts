import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    return this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });
  }

  async validateCredentials(dto: LoginDto): Promise<User> {
    const user = await this.users.findByEmail(dto.email);
    // Use a dummy verify to keep timing constant even when the user does not exist.
    const fallbackHash =
      '$argon2id$v=19$m=65536,t=3,p=4$cm9hZHNhcmVtYWRlb2ZkdXN0$YkBg6mZK7H8sQ6QcZBR2YEKM2ChGv1n2gXBn4G3R4Ao';
    const hash = user?.passwordHash ?? fallbackHash;
    const ok = await argon2.verify(hash, dto.password).catch(() => false);
    if (!user || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
