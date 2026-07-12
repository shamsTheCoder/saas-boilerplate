// =============================================================================
// @saas/database — TYPE EXPORTS ONLY
// =============================================================================
// This package exports Prisma-generated types for use across the monorepo.
// It does NOT export PrismaClient.
//
// PrismaClient must be instantiated ONLY inside apps/api (NestJS PrismaService)
// to preserve Dependency Injection and connection pool management.
// =============================================================================

export type {
  User,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
  Organization,
  OrgMember,
  Invitation,
  Subscription,
  AuditLog,
  OrgRole,
  SubscriptionStatus,
  Prisma,
} from '@prisma/client';
