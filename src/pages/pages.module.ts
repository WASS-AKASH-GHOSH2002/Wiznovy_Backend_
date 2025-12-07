import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Page } from './entities/page.entity';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page]), AuthModule],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
