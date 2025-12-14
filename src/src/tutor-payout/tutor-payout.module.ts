import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorPayoutController } from './tutor-payout.controller';
import { TutorPayoutService } from './tutor-payout.service';
import { TutorPayout } from './entities/tutor-payout.entity';
import { Account } from 'src/account/entities/account.entity';
import { BankDetail } from 'src/bank-details/entities/bank-detail.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NodeMailerModule } from 'src/node-mailer/node-mailer.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorPayout, Account, BankDetail, Wallet]),
    AuthModule,
    NodeMailerModule,
    NotificationsModule
  ],
  controllers: [TutorPayoutController],
  providers: [TutorPayoutService],
  exports: [TutorPayoutService]
})
export class TutorPayoutModule {}