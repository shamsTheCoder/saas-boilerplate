import { SetMetadata } from '@nestjs/common';

/** Mark a route as public — skips the JwtAuthGuard when applied globally on Day 5. */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
