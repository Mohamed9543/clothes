import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvConfig } from '../../config/env.validation';
import { JwtAccessPayload } from './jwt-access.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<EnvConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtAccessPayload): JwtAccessPayload & { refreshToken: string } {
    const refreshToken = req.body?.refreshToken as string;
    return { ...payload, refreshToken };
  }
}
