import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Socket } from 'node:dgram';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwtFromWsHeader,
      secretOrKey: process.env.WIZNOVY_JWT_SECRET,
    });
  }

  async validate(payload) {
    const user = await this.authService.validate(payload.id);
    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}

export const ExtractJwtFromWsHeader = (req: Socket): string | null => {
  if (req['handshake']) {
    return req['handshake'].headers.authorization?.replace('Bearer ', '');
  } else {
    throw new UnauthorizedException('Authentication failed');
  }
};
