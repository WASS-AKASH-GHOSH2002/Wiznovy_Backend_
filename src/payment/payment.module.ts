import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Session } from '../session/entities/session.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { NodeMailerModule } from '../node-mailer/node-mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPurchase, Account, Session]),
    NotificationsModule,
    NodeMailerModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}