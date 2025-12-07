import { Module } from '@nestjs/common';
import { ContactUsService } from './contact-us.service';
import { ContactUsController } from './contact-us.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ContactUs } from './entities/contact-us.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ContactUs]),AuthModule],
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
