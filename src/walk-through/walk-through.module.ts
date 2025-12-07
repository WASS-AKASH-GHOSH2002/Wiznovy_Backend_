import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalkThroughService } from './walk-through.service';
import { WalkThroughController } from './walk-through.controller';
import { WalkThrough } from './entities/walk-through.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WalkThrough]), AuthModule],
  controllers: [WalkThroughController],
  providers: [WalkThroughService],
  exports: [WalkThroughService],
})
export class WalkThroughModule {}
