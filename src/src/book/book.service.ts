import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookImage } from './entities/book-image.entity';
import { CreateBookDto, BookPaginationDto, UpdateStatusDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookImage)
    private readonly bookImageRepo: Repository<BookImage>,
  ) {}

  async create(dto: CreateBookDto) {
    const existing = await this.bookRepo.findOne({ 
      where: [{ name: dto.name }, { name: dto.name, authorName: dto.authorName }] 
    });
    if (existing) throw new ConflictException('Book with this name already exists');

    const book = this.bookRepo.create(dto);
    return await this.bookRepo.save(book);
  }

  async findAll(dto: BookPaginationDto) {
    const queryBuilder = this.bookRepo.createQueryBuilder('book');

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.description LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.status) {
      queryBuilder.andWhere('book.status = :status', { status: dto.status });
    }

    const [result, total] = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser(dto: BookPaginationDto) {
    const queryBuilder = this.bookRepo.createQueryBuilder('book')
      .leftJoinAndSelect('book.bookImages', 'bookImages')
      .where('book.status = :status', { status: 'ACTIVE' });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async findOne(id: string) {
    const book = await this.bookRepo.findOne({ 
      where: { id },
      relations: ['bookImages']
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    const book = await this.findOne(id);
    
    if (dto.name && dto.name !== book.name) {
      const existing = await this.bookRepo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Book with this name already exists');
    }

    Object.assign(book, dto);
    return await this.bookRepo.save(book);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const book = await this.findOne(id);
    book.status = dto.status;
    return await this.bookRepo.save(book);
  }

  async updateCoverImage(id: string, filePath: string) {
    const book = await this.findOne(id);
    
    if (book.coverImagePath) {
      const oldPath = join(__dirname, '..', '..', book.coverImagePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old cover image: ${oldPath}`, err.message);
      }
    }
    
    book.coverImage = process.env.WIZNOVY_CDN_LINK + filePath;
    book.coverImagePath = filePath;
    return this.bookRepo.save(book);
  }

  async addImages(id: string, files: Express.Multer.File[]) {
    const book = await this.findOne(id);
    
    const bookImages = files.map(file => {
      const bookImage = new BookImage();
      bookImage.image = process.env.WIZNOVY_CDN_LINK + file.path;
      bookImage.imagePath = file.path;
      bookImage.book = book;
      return bookImage;
    });
    
    return this.bookImageRepo.save(bookImages);
  }

  async updateBookImage(imageId: string, filePath: string) {
    const bookImage = await this.bookImageRepo.findOne({ where: { id: imageId } });
    if (!bookImage) throw new NotFoundException('Book image not found');
    
    if (bookImage.imagePath) {
      const oldPath = join(__dirname, '..', '..', bookImage.imagePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    
    bookImage.image = process.env.WIZNOVY_CDN_LINK + filePath;
    bookImage.imagePath = filePath;
    return this.bookImageRepo.save(bookImage);
  }

  async replaceAllImages(id: string, files: Express.Multer.File[]) {
    const book = await this.findOne(id);
    
    for (const bookImage of book.bookImages) {
      if (bookImage.imagePath) {
        const oldPath = join(__dirname, '..', '..', bookImage.imagePath);
        try {
          unlinkSync(oldPath);
        } catch (err) {
          console.warn(`Failed to delete old image: ${oldPath}`, err.message);
        }
      }
    }
    await this.bookImageRepo.remove(book.bookImages);
    
    const bookImages = files.map(file => {
      const bookImage = new BookImage();
      bookImage.image = process.env.WIZNOVY_CDN_LINK + file.path;
      bookImage.imagePath = file.path;
      bookImage.book = book;
      return bookImage;
    });
    
    return this.bookImageRepo.save(bookImages);
  }

  async deleteBookImage(imageId: string) {
    const bookImage = await this.bookImageRepo.findOne({ where: { id: imageId } });
    if (!bookImage) throw new NotFoundException('Book image not found');
    
    if (bookImage.imagePath) {
      const oldPath = join(__dirname, '..', '..', bookImage.imagePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete image: ${oldPath}`, err.message);
      }
    }
    
    await this.bookImageRepo.remove(bookImage);
    return { message: 'Book image deleted successfully' };
  }

  async manageImages(id: string, action: 'add' | 'replace' | 'update' | 'delete', imageId?: string, files?: Express.Multer.File[]) {
    switch (action) {
      case 'add':
        return this.addImages(id, files);
      case 'replace':
        return this.replaceAllImages(id, files);
      case 'update':
        if (!imageId || !files?.[0]) throw new ConflictException('Image ID and file required for update');
        return this.updateBookImage(imageId, files[0].path);
      case 'delete':
        if (!imageId) throw new ConflictException('Image ID required for delete');
        return this.deleteBookImage(imageId);
      default:
        throw new ConflictException('Invalid action. Use: add, replace, update, or delete');
    }
  }

  async remove(id: string) {
    const book = await this.findOne(id);
    await this.bookRepo.remove(book);
    return { message: 'Book deleted successfully' };
  }
}
