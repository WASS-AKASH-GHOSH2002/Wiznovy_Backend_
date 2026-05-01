import { Module } from '@nestjs/common';
import { StateService } from './state.service';
import { StateController } from './state.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from './entities/state.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([State]), AuthModule],
  controllers: [StateController],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}