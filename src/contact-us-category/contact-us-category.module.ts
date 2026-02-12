import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactUsCategoryService } from './contact-us-category.service';
import { ContactUsCategoryController } from './contact-us-category.controller';
import { ContactUsCategory } from './entities/contact-us-category.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContactUsCategory]), AuthModule],
  controllers: [ContactUsCategoryController],
  providers: [ContactUsCategoryService],
})
export class ContactUsCategoryModule {}
