import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { City } from './entities/city.entity';
import { State } from 'src/state/entities/state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City, State]), AuthModule],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule {}
