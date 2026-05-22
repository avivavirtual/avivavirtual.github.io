import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUser {
  sub: string;
  email: string;
  role: string;
  organizationId?: string;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
