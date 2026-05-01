import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SabbathService } from './sabbath.service';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { UserRole } from 'src/enum';

@Injectable()
export class SabbathGuard implements CanActivate {
  constructor(
    private readonly sabbathService: SabbathService,
    @InjectRepository(UserDetail) private readonly userRepo: Repository<UserDetail>,
    @InjectRepository(TutorDetail) private readonly tutorRepo: Repository<TutorDetail>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true; // no user = let auth guard handle it

    let lat: number, lng: number, timezone: string;

    if (user.roles === UserRole.TUTOR) {
      const detail = await this.tutorRepo.findOne({ where: { accountId: user.id } });
      lat = detail?.lat;
      lng = detail?.lng;
      timezone = detail?.timezone;
    } else {
      const detail = await this.userRepo.findOne({ where: { accountId: user.id } });
      lat = detail?.lat;
      lng = detail?.lng;
      timezone = detail?.timezone;
    }

    // fallback — if no location set, skip Sabbath check
    if (!lat || !lng || !timezone) return true;

    const status = await this.sabbathService.isSabbath(lat, lng, timezone);

    if (status.isSabbath) {
      throw new ForbiddenException(status.message);
    }

    return true;
  }
}
