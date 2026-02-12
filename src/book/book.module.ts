import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book } from './entities/book.entity';
import { BookImage } from './entities/book-image.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Language } from 'src/languages/entities/language.entity';
import { SavedBook } from 'src/saved-books/entities/saved-book.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookImage, Subject, Language, SavedBook]),
    AuthModule
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
