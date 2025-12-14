import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { Banner } from './entities/banner.entity';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner]),
    AuthModule,
    MulterModule.register({ dest: './uploads/Banners' }),
  ],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
