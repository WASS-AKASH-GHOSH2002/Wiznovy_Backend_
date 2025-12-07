import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { StaffDetail } from './entities/staff-detail.entity';
import { StaffDetailsController } from './staff-details.controller';
import { StaffDetailsService } from './staff-details.service';
import { Menu } from 'src/menus/entities/menu.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffDetail, Menu]),
    AuthModule,
    MulterModule.register(),
  ],
  controllers: [StaffDetailsController],
  providers: [StaffDetailsService],
})
export class StaffDetailsModule {}
