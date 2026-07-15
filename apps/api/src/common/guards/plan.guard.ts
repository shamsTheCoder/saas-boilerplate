import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/prisma/prisma.service";
import { REQUIRE_PLAN_KEY } from "@/common/decorators/require-plan.decorator";
import { RequestUser } from "@/common/decorators/current-user.decorator";

// Define plan hierarchy — higher index = more features
const PLAN_HIERARCHY = ["free", "pro", "enterprise"];

/**
 * Verifies the org's active subscription plan meets the @RequirePlan() requirement.
 * Must be applied AFTER JwtAuthGuard and OrgRolesGuard (so organizationId is on req).
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<string>(
      REQUIRE_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlan) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    // Prefer the organizationId already resolved by OrgRolesGuard
    const organizationId: string | undefined =
      request.organizationId ?? request.params?.orgId;

    if (!organizationId) {
      throw new ForbiddenException(
        "Organization context required for plan check",
      );
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      select: { planId: true, status: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      throw new ForbiddenException(
        "An active subscription is required to access this feature",
      );
    }

    const currentPlanIndex = PLAN_HIERARCHY.indexOf(subscription.planId);
    const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);

    if (currentPlanIndex < requiredPlanIndex) {
      throw new ForbiddenException(
        `This feature requires the '${requiredPlan}' plan. You are on '${subscription.planId}'.`,
      );
    }

    return true;
  }
}
