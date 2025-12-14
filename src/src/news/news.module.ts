import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { News } from './entities/news.entity';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([News]),
    AuthModule,
    MulterModule.register({ dest: './uploads/news' }),
  ],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
