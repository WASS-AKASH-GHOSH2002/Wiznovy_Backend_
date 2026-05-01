import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Session } from '../session/entities/session.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { NodeMailerModule } from '../node-mailer/node-mailer.module';
import { ZoomModule } from '../zoom/zoom.module';
import { SettingsModule } from '../settings/settings.module';
import { Course } from 'src/course/entities/course.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

import { SabbathModule } from '../sabbath/sabbath.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, UserPurchase, Account, Session, Course]),
    NotificationsModule,
    NodeMailerModule,
    ZoomModule,
    SettingsModule,
    WalletModule,
    AuthModule,
    SabbathModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}