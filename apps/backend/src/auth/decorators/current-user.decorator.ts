import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAccessPayload } from '../strategies/jwt-access.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAccessPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
