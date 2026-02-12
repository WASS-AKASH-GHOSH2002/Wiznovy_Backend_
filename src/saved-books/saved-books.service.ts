import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { SavedBook } from './entities/saved-book.entity';
import { Book } from '../book/entities/book.entity';
import { CreateSavedBookDto, SavedBookPaginationDto } from './dto/create-saved-book.dto';

@Injectable()
export class SavedBooksService {
  constructor(
    @InjectRepository(SavedBook)
    private readonly savedBookRepo: Repository<SavedBook>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>
  ) {}

  async create(dto: CreateSavedBookDto, userId: string) {
    const book = await this.bookRepo.findOne({ where: { id: dto.bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const existing = await this.savedBookRepo.findOne({
      where: { userId, bookId: dto.bookId }
    });
    if (existing) {
      throw new ConflictException('Book already saved');
    }

    const savedBook = this.savedBookRepo.create({
      userId,
      bookId: dto.bookId
    });

    await this.savedBookRepo.save(savedBook);
    
    
   

    return savedBook;
  }

  async findAll(userId: string, dto: SavedBookPaginationDto) {
    const queryBuilder = this.savedBookRepo.createQueryBuilder('savedBook')
      .leftJoinAndSelect('savedBook.book', 'book')
      .leftJoinAndSelect('book.bookImages', 'bookImages')
      .where('savedBook.userId = :userId', { userId });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await queryBuilder
      .orderBy('savedBook.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async remove(bookId: string, userId: string) {
    const savedBook = await this.savedBookRepo.findOne({
      where: { userId, bookId }
    });

    if (!savedBook) {
      throw new NotFoundException('Saved book not found');
    }

    await this.savedBookRepo.remove(savedBook);
    return { message: 'Book removed from saved list successfully' };
  }
}