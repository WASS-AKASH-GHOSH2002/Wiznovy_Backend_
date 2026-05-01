import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SabbathService } from './sabbath.service';
import { SabbathGuard } from './sabbath.guard';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetail, TutorDetail])],
  providers: [SabbathService, SabbathGuard],
  exports: [SabbathService, SabbathGuard, TypeOrmModule],
})
export class SabbathModule {}
