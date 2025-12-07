import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Session } from './entities/session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TutorAvailabilityModule } from '../tutor-availability/tutor-availability.module';
import { NodeMailerModule } from '../node-mailer/node-mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, TutorDetail, UserPurchase, Account]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    TutorAvailabilityModule,
    NodeMailerModule
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}