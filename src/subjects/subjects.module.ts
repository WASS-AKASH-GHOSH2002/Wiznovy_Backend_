import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, TutorDetail]),AuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
