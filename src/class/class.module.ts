import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Class]),AuthModule ],
  controllers: [ClassController],
  providers: [ClassService],
})
export class ClassModule {}
