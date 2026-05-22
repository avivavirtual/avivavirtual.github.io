import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AuthTokens, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const organization = await this.prisma.organization.create({
      data: { name: dto.organizationName }
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.CLIENT_ADMIN,
        organizationId: organization.id
      }
    });

    return { userId: user.id, organizationId: organization.id };
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.createTokens(user);
  }

  async refresh(refreshToken?: string): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      return this.login({ email: user.email, password: '' } as LoginDto);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
