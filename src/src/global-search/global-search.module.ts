import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchController } from './global-search.controller';
import { Course } from 'src/course/entities/course.entity';
import { Book } from 'src/book/entities/book.entity';
import { SearchHistory } from 'src/search-history/entities/search-history.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Country } from 'src/country/entities/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TutorDetail, Course, Book, SearchHistory,Subject,Country])],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
})
export class GlobalSearchModule {}
