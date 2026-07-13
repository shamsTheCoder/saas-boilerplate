import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global means any module that imports AppModule gets PrismaService for free
// — no need to import PrismaModule everywhere
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
