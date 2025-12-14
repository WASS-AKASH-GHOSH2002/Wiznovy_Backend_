import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { NodeMailerController } from './node-mailer.controller';
import { NodeMailerService } from './node-mailer.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587, 
        // secure: true,
        tls: { rejectUnauthorized: true },
        auth: {
          user: 'hp5709139@gmail.com', 
          pass: 'iuvu vxoo mxyb klht',  
        },
      },
    })
  ],
  controllers: [NodeMailerController],
  providers: [NodeMailerService],
  exports: [NodeMailerService],
})
export class NodeMailerModule { }
