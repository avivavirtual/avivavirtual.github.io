import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string | null;
  isActive: boolean;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async register(input: { email: string; password: string; firstName: string; lastName: string }) {
    const passwordHash = await hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: { email: input.email.toLowerCase(), passwordHash, firstName: input.firstName, lastName: input.lastName, organizationId: null },
    });
    return this.sanitizeUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { clientAssignments: true } });
    if (!user || !user.isActive || !(await compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, role: user.role, organizationId: user.organizationId };
    const accessToken = await this.jwt.signAsync(payload, { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY') ?? '15m' });
    const refreshToken = await this.jwt.signAsync(payload, { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY') ?? '7d' });
    await this.prisma.refreshToken.create({ data: { token: await hash(refreshToken, 12), userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return { accessToken, refreshToken, user: this.sanitizeUser(user), assignments: user.clientAssignments };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; role: Role; organizationId: string | null; isActive: boolean }): AuthenticatedUser {
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, organizationId: user.organizationId, isActive: user.isActive };
  }
}
