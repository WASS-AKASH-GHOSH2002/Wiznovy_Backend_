import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting } from './entities/setting.entity';
import { WithdrawalSettings } from './entities/withdrawal-settings.entity';
import { SessionSettings } from './entities/session-settings.entity';
import { CancellationSettings } from './entities/cancellation-settings.entity';
import { RescheduleSettings } from './entities/reschedule-settings.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting, WithdrawalSettings, SessionSettings, CancellationSettings, RescheduleSettings]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}