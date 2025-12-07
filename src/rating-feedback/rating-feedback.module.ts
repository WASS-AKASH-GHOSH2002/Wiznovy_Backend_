import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { RatingFeedback } from './entities/rating-feedback.entity';
import { RatingFeedbackController } from './rating-feedback.controller';
import { RatingFeedbackService } from './rating-feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([RatingFeedback]), AuthModule],
  controllers: [RatingFeedbackController],
  providers: [RatingFeedbackService],
  exports: [RatingFeedbackService],
})
export class RatingFeedbackModule {}
