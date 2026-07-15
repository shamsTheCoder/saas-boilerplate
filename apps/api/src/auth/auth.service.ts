import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TokenService } from '@/auth/token.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RegisterDto } from '@/auth/dto/register.dto';
import { LoginDto } from '@/auth/dto/login.dto';
import { ForgotPasswordDto } from '@/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/auth/dto/reset-password.dto';
import { Response, Request } from 'express';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const VERIFY_EMAIL_TTL_MS   = 24 * 60 * 60 * 1000;  // 24 hours
const PASSWORD_RESET_TTL_MS =  1 * 60 * 60 * 1000;  // 1 hour

@Injectable()
export class AuthService implements OnModuleInit {
  /**
   * Pre-computed dummy argon2 hash used during login when the email is not found.
   * By always running argon2.verify() we prevent timing-based email enumeration attacks.
   * (Finding: user not found → ~1ms vs. wrong password → ~300ms is measurable by attackers)
   */
  private dummyHash: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {}

  async onModuleInit() {
    // Compute the dummy hash once at startup — argon2 is intentionally slow, so we do this eagerly
    this.dummyHash = await argon2.hash('__dummy_timing_prevention_placeholder__');
  }

  // ─── register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (existing) {
      // SECURITY: Do NOT return 409. Return identical 201 to prevent email enumeration.
      this.logger.info({ email: dto.email }, 'Register: email already exists — silently suppressed');
      return { message: 'Registration successful.' };
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      // Auto-verify email for now to allow immediate login
      data: { email: dto.email, passwordHash, name: dto.name ?? null, emailVerified: true },
    });

    this.logger.info({ userId: user.id, email: dto.email }, 'New user registered and auto-verified');

    return { message: 'Registration successful.' };
  }

  // ─── login ────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    res: Response,
    ip: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    // SECURITY: Always run argon2.verify — prevents timing-based email enumeration.
    // If user not found, verify against our dummy hash (always false, but same timing).
    const isPasswordValid = await argon2
      .verify(user?.passwordHash ?? this.dummyHash, dto.password)
      .catch(() => false);

    if (!user || !isPasswordValid) {
      this.logger.warn({ email: dto.email, ip }, 'Failed login attempt');
      throw new UnauthorizedException('Invalid email or password');
    }

    // SECURITY: Block unverified accounts from obtaining tokens
    if (!user.emailVerified) {
      throw new ForbiddenException('Please verify your email address before logging in.');
    }

    const { accessToken, rawRefreshToken, familyId } =
      await this.tokenService.generateTokenPair(user.id);

    this.tokenService.setRefreshCookie(res, rawRefreshToken, familyId);
    this.logger.info({ userId: user.id }, 'User logged in');

    return { accessToken };
  }

  // ─── refresh ──────────────────────────────────────────────────────────────

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const rawCookie = req.cookies?.['refresh_token'] as string | undefined;

    if (!rawCookie) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const parsed = this.tokenService.parseRefreshCookie(rawCookie);
    if (!parsed) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const { rawToken, familyId } = parsed;
    const tokenHash = this.tokenService.hashToken(rawToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord) {
      // SECURITY: Token not found but we have its familyId — this is a replay of an
      // already-rotated token, which is a strong signal of token theft.
      // Invalidate the entire family to protect the legitimate user.
      this.logger.warn({ familyId }, 'Refresh token reuse detected — invalidating entire family');
      await this.tokenService.invalidateFamily(familyId);
      throw new UnauthorizedException('Session invalidated due to suspicious activity. Please log in again.');
    }

    // Check token has not expired in the DB (belt-and-suspenders beyond cookie maxAge)
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { tokenHash } });
      this.tokenService.clearRefreshCookie(res);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate: delete old, create new — atomic transaction
    let accessToken: string;
    let newRawToken: string;
    try {
      const rotated = await this.tokenService.rotateRefreshToken(tokenHash, tokenRecord.userId, familyId);
      accessToken = rotated.accessToken;
      newRawToken = rotated.rawRefreshToken;
    } catch (err: any) {
      if (err?.code === 'P2025') {
        // Safe UX fallback: P2025 during rotation is very commonly a benign race condition
        // from a frontend (e.g. React/Next.js) sending concurrent parallel API requests.
        // Instead of instantly logging the user out and wiping their entire session family,
        // we safely swallow the error. The second request just fails, while the first request succeeds.
        this.logger.warn({ familyId }, 'Concurrent refresh token replay detected — swallowing race condition');
        throw new UnauthorizedException('Concurrent refresh request');
      }
      throw err;
    }

    this.tokenService.setRefreshCookie(res, newRawToken, familyId);

    return { accessToken };
  }

  // ─── logout ───────────────────────────────────────────────────────────────

  async logout(req: Request, res: Response): Promise<void> {
    const rawCookie = req.cookies?.['refresh_token'] as string | undefined;

    if (rawCookie) {
      const parsed = this.tokenService.parseRefreshCookie(rawCookie);
      if (parsed) {
        const tokenHash = this.tokenService.hashToken(parsed.rawToken);
        // Delete only this device's token — not all sessions (use "logout everywhere" for that)
        await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
      }
    }

    this.tokenService.clearRefreshCookie(res);
    this.logger.info('User logged out (token cleared)');
  }

  // ─── verify-email ─────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      // Delete expired token if it exists
      if (record) await this.prisma.emailVerificationToken.delete({ where: { tokenHash } });
      throw new BadRequestException('Invalid or expired verification link.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    this.logger.info({ userId: record.userId }, 'Email verified');
    return { message: 'Email verified successfully.' };
  }

  // ─── forgot-password ──────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const GENERIC_RESPONSE = { message: 'If that email is registered, a reset link has been sent.' };

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });

    // SECURITY: Always return the same response — never reveal whether the email exists
    if (!user) return GENERIC_RESPONSE;

    // Invalidate any existing reset tokens for this user before creating a new one
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    // STUB: EMAIL_JOB { type: 'reset-password', to: dto.email, token: rawToken }
    // SECURITY: never log the raw token — mask it so log aggregators cannot be used to reset accounts
    this.logger.info({ type: 'reset-password', to: dto.email, tokenMasked: rawToken.slice(0, 8) + '...' }, 'EMAIL_JOB');

    return GENERIC_RESPONSE;
  }

  // ─── reset-password ───────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(dto.token);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) await this.prisma.passwordResetToken.delete({ where: { tokenHash } });
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const newPasswordHash = await argon2.hash(dto.password);

    // Atomic: update password + delete ALL refresh tokens (force re-login everywhere) + delete used reset token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
      this.prisma.passwordResetToken.delete({ where: { tokenHash } }),
    ]);

    this.logger.info({ userId: record.userId }, 'Password reset — all sessions invalidated');
    return { message: 'Password reset successfully. Please log in again.' };
  }
}
