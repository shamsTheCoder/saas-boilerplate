import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LoggerModule } from "nestjs-pino";
import { PrismaModule } from "@/prisma/prisma.module";
import { AuthController } from "@/auth/auth.controller";
import { AuthService } from "@/auth/auth.service";
import { TokenService } from "@/auth/token.service";
import { JwtStrategy } from "@/auth/jwt.strategy";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    LoggerModule,

    // Configure JwtModule async so it can read secrets from ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.accessSecret"),
        signOptions: {
          expiresIn: config.get<string>("jwt.accessExpiresIn", "15m") as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [TokenService, JwtStrategy], // exported so future modules (e.g. OrgsModule) can reuse
})
export class AuthModule {}
