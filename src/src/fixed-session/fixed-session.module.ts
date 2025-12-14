import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedSessionService } from './fixed-session.service';
import { FixedSessionController } from './fixed-session.controller';
import { FixedSession } from './entities/fixed-session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FixedSession, TutorDetail, UserPurchase]),
    NotificationsModule
  ],
  controllers: [FixedSessionController],
  providers: [FixedSessionService],
  exports: [FixedSessionService],
})
export class FixedSessionModule {}