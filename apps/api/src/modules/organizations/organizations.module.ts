import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { OrganizationsController } from '@/modules/organizations/organizations.controller';
import { OrganizationsService } from '@/modules/organizations/organizations.service';

@Module({
  imports: [PrismaModule, LoggerModule, AuditModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
