import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Account } from 'src/account/entities/account.entity';
import { Course } from 'src/course/entities/course.entity';
import { Book } from 'src/book/entities/book.entity';
import { TutorPayout } from 'src/tutor-payout/entities/tutor-payout.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Course, Book, TutorPayout, Payment]), AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
