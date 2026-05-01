import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignationsService } from './designations.service';
import { DesignationsController } from './designations.controller';
import { Designation } from './entities/designation.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Designation]), AuthModule],
  controllers: [DesignationsController],
  providers: [DesignationsService],
  exports: [DesignationsService],
})
export class DesignationsModule {}
