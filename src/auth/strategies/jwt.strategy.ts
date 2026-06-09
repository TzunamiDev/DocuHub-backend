import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    let secretOrKey = configService.get<string>('app.jwtSecret');
    if (!secretOrKey && fs.existsSync('./jwt_secret.txt')) {
      secretOrKey = fs.readFileSync('./jwt_secret.txt', 'utf-8').trim();
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token = null;
          if (request && request.cookies) {
            token = request.cookies['Authentication'];
          }
          return token || ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secretOrKey || 'fallback-that-should-never-be-used',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
