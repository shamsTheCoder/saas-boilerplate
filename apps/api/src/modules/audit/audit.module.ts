import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditLogService } from '@/modules/audit/audit.service';

@Module({
  imports: [PrismaModule],
  providers: [AuditLogService],
  exports: [AuditLogService], // Exported so OrganizationsModule and others can inject it
})
export class AuditModule {}
