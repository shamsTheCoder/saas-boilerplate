import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;  // userId
  jti: string;  // unique token ID — enables future revocation via blocklist
  iat: number;
  exp: number;
}

/** Reads the Bearer token from Authorization header, verifies signature, and attaches { userId, jti } to req.user. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  /** Called after signature verification succeeds. Return value is attached to req.user. */
  async validate(payload: JwtPayload) {
    return { userId: payload.sub, jti: payload.jti };
  }
}
