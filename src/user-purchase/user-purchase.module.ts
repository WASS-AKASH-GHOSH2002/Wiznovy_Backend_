import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPurchaseService } from './user-purchase.service';
import { UserPurchaseController } from './user-purchase.controller';
import { UserPurchase } from './entities/user-purchase.entity';
import { Course } from '../course/entities/course.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPurchase, Course]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [UserPurchaseController],
  providers: [UserPurchaseService],
  exports: [UserPurchaseService, TypeOrmModule],
})
export class UserPurchaseModule {}