import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { Response } from 'express';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

/** Cookie format: `<64-char hex token>|<uuid familyId>` — both values separated by pipe. */
const COOKIE_NAME = 'refresh_token';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Hashing ──────────────────────────────────────────────────────────────

  /**
   * SHA-256 hash of a random token.
   * We use SHA-256 (not argon2) here because the input is cryptographically random bytes,
   * not a user-chosen password. Random bytes have no dictionary attack surface.
   */
  hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  // ─── Token Pair Generation ─────────────────────────────────────────────────

  /**
   * Issue a new access JWT + refresh token and persist the hashed refresh token.
   * @param userId - The user's UUID
   * @param familyId - Existing family ID to continue (token rotation), or undefined for a new login
   * @returns Access token string, raw refresh token string, and the resolved familyId
   */
  async generateTokenPair(
    userId: string,
    familyId?: string,
  ): Promise<{ accessToken: string; rawRefreshToken: string; familyId: string }> {
    const resolvedFamilyId = familyId ?? randomUUID();

    // Access JWT — only sub + jti, no PII (email can become stale within 15-min TTL)
    const accessToken = this.jwtService.sign({
      sub: userId,
      jti: randomUUID(),
    });

    // Generate raw refresh token, hash it, store the hash — never the raw value
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: { tokenHash, familyId: resolvedFamilyId, userId, expiresAt },
    });

    return { accessToken, rawRefreshToken, familyId: resolvedFamilyId };
  }

  // ─── Token Rotation (atomic) ───────────────────────────────────────────────

  /**
   * Delete the old token and issue a new pair — wrapped in a transaction so a crash
   * between delete and insert can't permanently log the user out.
   */
  async rotateRefreshToken(
    oldTokenHash: string,
    userId: string,
    familyId: string,
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    return this.prisma.$transaction(async (tx) => {
      // Delete old — if this fails, the transaction rolls back and the old token stays valid
      await tx.refreshToken.delete({ where: { tokenHash: oldTokenHash } });

      const accessToken = this.jwtService.sign({
        sub: userId,
        jti: randomUUID(),
      });

      const raw = crypto.randomBytes(32).toString('hex');
      const newHash = this.hashToken(raw);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      await tx.refreshToken.create({
        data: { tokenHash: newHash, familyId, userId, expiresAt },
      });

      return { accessToken, rawRefreshToken: raw };
    });
  }

  // ─── Family Invalidation (reuse detection) ────────────────────────────────

  /**
   * Called when a stolen/replayed token is detected — wipes ALL tokens in the family,
   * forcing the legitimate user to re-authenticate.
   */
  async invalidateFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { familyId } });
  }

  // ─── Cookie Helpers ────────────────────────────────────────────────────────

  /**
   * Set the httpOnly refresh cookie.
   * Cookie value: `${rawToken}|${familyId}` — pipe-delimited so both can be parsed server-side.
   * `secure: true` only in production — keeps local dev (HTTP) working.
   */
  setRefreshCookie(res: Response, rawToken: string, familyId: string): void {
    const isProduction = this.config.get<string>('nodeEnv') === 'production';
    res.cookie(COOKIE_NAME, `${rawToken}|${familyId}`, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_MS, // Aligns cookie lifetime with DB token TTL
    });
  }

  /** Parse the `rawToken` and `familyId` from the composite cookie value. */
  parseRefreshCookie(cookieValue: string): { rawToken: string; familyId: string } | null {
    const parts = cookieValue.split('|');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return { rawToken: parts[0], familyId: parts[1] };
  }

  /** Clear the refresh cookie — called on logout. */
  clearRefreshCookie(res: Response): void {
    const isProduction = this.config.get<string>('nodeEnv') === 'production';
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }
}
