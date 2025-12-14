import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { Unit } from './entities/unit.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Course } from 'src/course/entities/course.entity';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Unit, Subject, Course, VideoLecture, StudyMaterial]),
    AuthModule,
  ],
  controllers: [UnitController],
  providers: [UnitService],
  exports: [UnitService],
})
export class UnitModule {}