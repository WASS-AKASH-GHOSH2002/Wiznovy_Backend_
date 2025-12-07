import { Module } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { LanguagesController } from './languages.controller';
import { Language } from './entities/language.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ TypeOrmModule.forFeature([Language]), AuthModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
})
export class LanguagesModule {}
