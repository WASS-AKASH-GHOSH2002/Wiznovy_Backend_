import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { GoalController } from './goal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [TypeOrmModule.forFeature([Goal]),AuthModule],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
