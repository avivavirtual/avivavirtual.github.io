import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

type JwtPayload = { sub: string; role: Role; organizationId?: string | null };
export type AuthenticatedRequest = { user: JwtPayload; headers: { authorization?: string } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');
    try {
      request.user = await this.jwt.verifyAsync<JwtPayload>(token, { secret: this.config.get<string>('JWT_ACCESS_SECRET') });
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token');
    }
  }

  private extractBearerToken(header?: string) {
    const [scheme, token] = header?.split(' ') ?? [];
    return scheme === 'Bearer' ? token : undefined;
  }
}
