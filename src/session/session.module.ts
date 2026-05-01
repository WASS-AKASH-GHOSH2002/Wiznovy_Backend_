import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Session } from './entities/session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

import { WalletTransaction } from '../wallet-transaction/entities/wallet-transaction.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { TutorAvailabilityModule } from '../tutor-availability/tutor-availability.module';
import { NodeMailerModule } from '../node-mailer/node-mailer.module';
import { ZoomModule } from '../zoom/zoom.module';
import { AdminActionLogModule } from '../admin-action-log/admin-action-log.module';
import { SlotLockModule } from '../slot-lock/slot-lock.module';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { SabbathModule } from '../sabbath/sabbath.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, TutorDetail, UserPurchase, Account, Wallet, WalletTransaction]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    TutorAvailabilityModule,
    NodeMailerModule,
    ZoomModule,
    AdminActionLogModule,
    SlotLockModule,
    AuthModule,
    SettingsModule,
    SabbathModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}