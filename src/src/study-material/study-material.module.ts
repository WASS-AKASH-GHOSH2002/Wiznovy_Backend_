import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyMaterialService } from './study-material.service';
import { StudyMaterialController } from './study-material.controller';
import { StudyMaterial } from './entities/study-material.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Course } from 'src/course/entities/course.entity';
import { AuthModule } from 'src/auth/auth.module';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([StudyMaterial, Unit, Subject, Course,VideoLecture]),
    AuthModule,
  ],
  controllers: [StudyMaterialController],
  providers: [StudyMaterialService],
  exports: [StudyMaterialService],
})
export class StudyMaterialModule { }