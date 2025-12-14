import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-apple';
import { AuthService } from '../auth.service';
import { LoginType } from 'src/enum';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID,
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
      callbackURL: process.env.APPLE_REDIRECT_URI,
      scope: ['name', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { email, name } = profile;
    const fullName = name ? `${name.firstName} ${name.lastName}` : email.split('@')[0];
    
    const result = await this.authService.validateOAuthLogin(email, fullName, null, LoginType.APPLE);
    done(null, result);
  }
}