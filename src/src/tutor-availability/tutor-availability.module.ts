import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorAvailabilityService } from './tutor-availability.service';
import { TutorAvailabilityController } from './tutor-availability.controller';
import { TutorAvailability } from './entities/tutor-availability.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { Session } from '../session/entities/session.entity';
import { TutorBlock } from '../tutor-block/entities/tutor-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TutorAvailability, TutorDetail, Session, TutorBlock])],
  controllers: [TutorAvailabilityController],
  providers: [TutorAvailabilityService],
  exports: [TutorAvailabilityService],
})
export class TutorAvailabilityModule {}