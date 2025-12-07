import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { Account } from 'src/account/entities/account.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { Course } from 'src/course/entities/course.entity';
import { Session } from 'src/session/entities/session.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Account, TutorDetail, Course, Session]), AuthModule, NotificationsModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule { }