import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodeMailerModule } from 'src/node-mailer/node-mailer.module';
import { Session } from 'src/session/entities/session.entity';
import { UserPurchase } from 'src/user-purchase/entities/user-purchase.entity';
import { ZoomMeeting } from 'src/zoom/entities/zoom.entity';
import { CronMailService } from './cron-mail.service';
import { CronMailScheduler } from './cron-mail.scheduler';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, UserPurchase, ZoomMeeting]),
    NodeMailerModule,
    WalletModule,
  ],
  providers: [CronMailService, CronMailScheduler],
  exports: [CronMailService],
})
export class CronMailModule {}
