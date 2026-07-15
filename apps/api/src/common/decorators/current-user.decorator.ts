import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  userId: string;
  jti: string;
}

/**
 * Extracts the authenticated user from `req.user` (set by JwtStrategy).
 * Usage: @CurrentUser() user: RequestUser
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
