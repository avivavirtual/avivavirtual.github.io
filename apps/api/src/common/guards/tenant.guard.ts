import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { role: string; organizationId?: string }; params: Record<string, string>; query: Record<string, string> }>();
    const user = request.user;
    const requestedOrg = request.params.organizationId ?? request.query.organizationId;
    if (!user || !requestedOrg || user.role === 'SUPER_ADMIN' || user.role === 'OPS_MANAGER') return true;
    if (user.organizationId === requestedOrg) return true;
    throw new ForbiddenException('Cross-tenant access denied');
  }
}
