import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { Course } from './entities/course.entity';
import { Account } from '../account/entities/account.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FileUploadErrorFilter } from '../utils/file-upload-error.filter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Account,
      UserPurchase,
      TutorDetail
    ]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [CourseController],
  providers: [
    CourseService,
    {
      provide: APP_FILTER,
      useClass: FileUploadErrorFilter,
    },
  ],
  exports: [CourseService],
})
export class CourseModule {}