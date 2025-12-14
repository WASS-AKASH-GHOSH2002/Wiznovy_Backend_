import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { Account } from 'src/account/entities/account.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TutorDetailsService } from './tutor-details.service';
import { TutorDetailsController } from './tutor-details.controller';
import { TutorDetail } from './entities/tutor-detail.entity';
import { FileUploadErrorFilter } from '../utils/file-upload-error.filter';

@Module({
  imports: [TypeOrmModule.forFeature([TutorDetail, Account]), AuthModule],
  controllers: [TutorDetailsController],
  providers: [
    TutorDetailsService,
    {
      provide: APP_FILTER,
      useClass: FileUploadErrorFilter,
    },
  ],
})
export class TutorDetailsModule {}
