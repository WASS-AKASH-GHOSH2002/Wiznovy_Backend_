import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { TutorSubject } from 'src/tutor-details/entities/tutor-subject.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, TutorDetail, TutorSubject]), AuthModule, NotificationsModule, SettingsModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
