import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { NodeMailerController } from './node-mailer.controller';
import { NodeMailerService } from './node-mailer.service';
import { SettingsModule } from 'src/settings/settings.module';
import { SettingsService } from 'src/settings/settings.service';

@Module({
  imports: [
    SettingsModule,
    MailerModule.forRootAsync({
      imports: [SettingsModule],
      inject: [SettingsService],
      useFactory: async (settingsService: SettingsService) => {
        const s = await settingsService.getSettings();
        return {
          transport: {
            host:    s?.emailHost     || 'smtp.gmail.com',
            port:    s?.emailPort     || 587,
            secure:  false,
            tls:     { rejectUnauthorized: true },
            auth: {
              user: s?.emailUser     || 'wiznovyproject2025@gmail.com',
              pass: s?.emailPassword || 'ycoe jncf rtsx cvhk',
            },
          },
        };
      },
    }),
  ],
  controllers: [NodeMailerController],
  providers: [NodeMailerService],
  exports: [NodeMailerService],
})
export class NodeMailerModule {}

