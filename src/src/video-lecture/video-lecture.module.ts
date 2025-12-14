import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoLectureService } from './video-lecture.service';
import { VideoLectureController } from './video-lecture.controller';
import { VideoLecture } from './entities/video-lecture.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { Course } from 'src/course/entities/course.entity';
import { CourseModule } from 'src/course/course.module';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([VideoLecture, Course, Unit]),
    forwardRef(() => CourseModule),
    AuthModule,
  ],
  controllers: [VideoLectureController],
  providers: [VideoLectureService],
  exports: [VideoLectureService],
})
export class VideoLectureModule { }