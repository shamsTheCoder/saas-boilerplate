import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

export interface AuditLogData {
  organizationId: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit logging service.
 * Records all significant user actions for compliance and security investigation.
 *
 * Usage: this.auditLog.log({ organizationId, userId, action: 'org.created', metadata: { orgId } });
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an audit event. Non-blocking — errors are silently swallowed so
   * a logging failure never breaks the primary business operation.
   */
  log(data: AuditLogData): void {
    // Intentionally NOT awaited — fire and forget
    this.prisma.auditLog
      .create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          action: data.action,
          metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
      .catch((err) => {
        // Log silently — audit logging must never fail the primary operation
        console.error("[AuditLogService] Failed to write audit log:", err);
      });
  }
}
