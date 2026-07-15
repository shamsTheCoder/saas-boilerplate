import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PLAN_KEY = 'requirePlan';

/**
 * Requires the org to have the specified subscription plan (or higher).
 * Used together with PlanGuard.
 *
 * Usage: @RequirePlan('pro')
 */
export const RequirePlan = (plan: string) => SetMetadata(REQUIRE_PLAN_KEY, plan);
