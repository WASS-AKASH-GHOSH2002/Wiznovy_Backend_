import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgressService } from './user-progress.service';
import { UserProgressController } from './user-progress.controller';
import { UserProgress } from './entities/user-progress.entity';
import { Course } from '../course/entities/course.entity';
import { Unit } from '../unit/entities/unit.entity';
import { StudyMaterial } from '../study-material/entities/study-material.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProgress,
      Course,
      Unit,
      StudyMaterial,
    ]),
    AuthModule
  ],
  controllers: [UserProgressController],
  providers: [UserProgressService],
  exports: [UserProgressService],
})
export class UserProgressModule {}
