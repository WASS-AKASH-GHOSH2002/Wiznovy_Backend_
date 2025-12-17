import { Module, } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPurchaseService } from './user-purchase.service';
import { UserPurchaseController } from './user-purchase.controller';
import { UserPurchase } from './entities/user-purchase.entity';
import { Course } from '../course/entities/course.entity';
import { Unit } from '../unit/entities/unit.entity';
import { StudyMaterial } from '../study-material/entities/study-material.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Account } from 'src/account/entities/account.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { NodeMailerModule } from 'src/node-mailer/node-mailer.module';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserPurchase, Course, Unit, StudyMaterial,VideoLecture, Account]),
    AuthModule,
    NotificationsModule,
    NodeMailerModule,
  ],
  controllers: [UserPurchaseController],
  providers: [UserPurchaseService],
  exports: [UserPurchaseService, TypeOrmModule],
})
export class UserPurchaseModule {}