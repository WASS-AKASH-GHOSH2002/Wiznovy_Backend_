import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedBooksController } from './saved-books.controller';
import { SavedBooksService } from './saved-books.service';
import { SavedBook } from './entities/saved-book.entity';
import { Book } from '../book/entities/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedBook, Book])],
  controllers: [SavedBooksController],
  providers: [SavedBooksService],
  exports: [SavedBooksService]
})
export class SavedBooksModule {}