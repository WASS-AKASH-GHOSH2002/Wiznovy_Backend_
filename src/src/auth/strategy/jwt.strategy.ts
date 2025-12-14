import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.WIZNOVY_JWT_SECRET,
    });
  }

  async validate(payload) {
    const user = await this.authService.validate(payload.id);
    if (!user) {
      throw new UnauthorizedException('Authentication failed.');
    }
    return user;
  }
}
