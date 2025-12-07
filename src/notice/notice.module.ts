import { Module } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notice]), AuthModule],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
