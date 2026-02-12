import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not, In } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookImage } from './entities/book-image.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Language } from 'src/languages/entities/language.entity';
import { SavedBook } from 'src/saved-books/entities/saved-book.entity';
import { CreateBookDto, BookPaginationDto, UpdateStatusDto, BulkBookStatusDto } from './dto/create-book.dto';
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
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(SavedBook)
    private readonly savedBookRepo: Repository<SavedBook>,
  ) {}

  async create(dto: CreateBookDto) {
    const existing = await this.bookRepo.findOne({
    where: {
      name: dto.name,
      authorName: dto.authorName,
    },
  });
    if (existing) throw new ConflictException('Book with this name already exists');

    const isbn = await this.generateIsbn();
    const book = this.bookRepo.create({ ...dto, isbn });
    return await this.bookRepo.save(book);
  }

  async createByTutor(dto: CreateBookDto, tutorId: string) {
    const existing = await this.bookRepo.findOne({
    where: {
      name: dto.name,
      authorName: dto.authorName,
    },
  });
    if (existing) throw new ConflictException('Book with this name already exists');

    const isbn = await this.generateIsbn();
    const book = this.bookRepo.create({ ...dto, createdBy: tutorId, isbn });
    return await this.bookRepo.save(book);
  }

  async findAll(dto: BookPaginationDto) {
    const queryBuilder = this.bookRepo.createQueryBuilder('book')
        .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .leftJoin('book.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.isbn',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
        'tutor.id',
        
        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.dob',
        'tutorDetail.gender',
        'tutorDetail.expertiseLevel',
        'tutorDetail.hourlyRate',
        'tutorDetail.profileImage',
        'tutorDetail.profileImagePath',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.createdAt',
        'tutorDetail.updatedAt'
      ])
 

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

    if (dto.languageId) {
      queryBuilder.andWhere('book.languageId = :languageId', { languageId: dto.languageId });
    }

    if (dto.subjectId) {
      queryBuilder.andWhere('book.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    const [result, total] = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser(dto: BookPaginationDto, userId: string) {
    const queryBuilder = this.bookRepo.createQueryBuilder('book')
     .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .leftJoin('book.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.isbn',
        'book.pdfFile',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
        'tutor.id',
        
        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.dob',
        'tutorDetail.gender',
        'tutorDetail.expertiseLevel',
        'tutorDetail.hourlyRate',
        'tutorDetail.profileImage',
        'tutorDetail.profileImagePath',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.createdAt',
        'tutorDetail.updatedAt'
      ])
      .where('book.status = :status', { status: 'APPROVED' });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.languageId) {
      queryBuilder.andWhere('book.languageId = :languageId', { languageId: dto.languageId });
    }

    if (dto.subjectId) {
      queryBuilder.andWhere('book.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    if (dto.tutorId) {
      queryBuilder.andWhere('book.createdBy = :tutorId', { tutorId: dto.tutorId });
    }

    const [result, total] = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();


    const bookIds = result.map(book => book.id);
    const savedBooks = bookIds.length > 0 ? await this.savedBookRepo.find({
      where: { userId, bookId: In(bookIds) },
      select: ['bookId']
    }) : [];
    const savedBookIds = new Set(savedBooks.map(sb => sb.bookId));

    const booksWithSavedStatus = result.map(book => ({
      ...book,
      isSaved: savedBookIds.has(book.id)
    }));

    return { result: booksWithSavedStatus, total };
  }

  async findByTutor(dto: BookPaginationDto, tutorId: string) {
    const queryBuilder = this.bookRepo.createQueryBuilder('book')
      .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.isbn',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name'
      ])
  
      .where('book.createdBy = :tutorId', { tutorId });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.status) {
      queryBuilder.andWhere('book.status = :status', { status: dto.status });
    }

    if (dto.languageId) {
      queryBuilder.andWhere('book.languageId = :languageId', { languageId: dto.languageId });
    }

    if (dto.subjectId) {
      queryBuilder.andWhere('book.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    const [result, total] = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async findOne(id: string) {
    const book = await this.bookRepo.createQueryBuilder('book')
       .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .leftJoin('book.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.isbn',
        'book.pdfFile',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdBy',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
        'tutor.id',
        
        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.dob',
        'tutorDetail.gender',
        'tutorDetail.expertiseLevel',
        'tutorDetail.hourlyRate',
        'tutorDetail.profileImage',
        'tutorDetail.profileImagePath',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.createdAt',
        'tutorDetail.updatedAt'
      ])
      .where('book.id = :id', { id })
      .getOne();
    if (!book) throw new NotFoundException('Book not found');
    
    
    const relatedBooks = book.createdBy ? await this.bookRepo.createQueryBuilder('book')
      .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.isbn',
        'book.pdfFile',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdBy',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
      ])
      .where('book.createdBy = :createdBy', { createdBy: book.createdBy })
      .andWhere('book.id != :id', { id })
      .andWhere('book.status = :status', { status: 'APPROVED' })
      .limit(5)
      .getMany() : [];
    
    return { ...book, relatedBooks };
  }

  async findOneByUser(id: string, userId: string) {
    const book = await this.bookRepo.createQueryBuilder('book')
    .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .leftJoin('book.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.pdfFile',
        'book.isbn',
        'book.totalPages',
        'book.averageRating',
        'book.totalRatings',
        'book.createdBy',
        'book.createdAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.expertiseLevel'
      ])
      
      .where('book.id = :id', { id })
      .andWhere('book.status = :status', { status: 'APPROVED' })
      .getOne();
    if (!book) throw new NotFoundException('Book not found');
    
   
    const savedBook = await this.savedBookRepo.findOne({
      where: { userId, bookId: id }
    });
    
   
    const relatedBooks = book.createdBy ? await this.bookRepo.createQueryBuilder('book')
      .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.coverImage',
        'book.averageRating',
        'book.totalRatings',
        'book.createdAt',
        'subject.name',
        'language.name'
      ])
      .where('book.createdBy = :createdBy', { createdBy: book.createdBy })
      .andWhere('book.id != :id', { id })
      .andWhere('book.status = :status', { status: 'APPROVED' })
      .limit(5)
      .getMany() : [];
    
    
    const relatedBookIds = relatedBooks.map(rb => rb.id);
    const savedRelatedBooks = relatedBookIds.length > 0 ? await this.savedBookRepo.find({
      where: { userId, bookId: In(relatedBookIds) },
      select: ['bookId']
    }) : [];
    const savedRelatedBookIds = new Set(savedRelatedBooks.map(sb => sb.bookId));
    
    const relatedBooksWithSavedStatus = relatedBooks.map(rb => ({
      ...rb,
      isSaved: savedRelatedBookIds.has(rb.id)
    }));
    
    return { ...book, isSaved: !!savedBook, relatedBooks: relatedBooksWithSavedStatus };
  }

  async findOneByTutor(id: string, tutorId: string) {
    const book = await this.bookRepo.createQueryBuilder('book')
     .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .select([
        'book.id',
        'book.name',
        'book.authorName',
        'book.description',
        'book.coverImage',
        'book.pdfFile',
        'book.isbn',
        'book.totalPages',
        'book.status',
        'book.averageRating',
        'book.totalRatings',
        'book.createdAt',
        'book.updatedAt',
        'bookImages.id',
        'bookImages.image',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name'
      ])
     
      .where('book.id = :id', { id })
      .andWhere('book.createdBy = :tutorId', { tutorId })
      .getOne();
    if (!book) throw new NotFoundException('Book not found or not created by you');
    return book;
  }

async update(id: string, dto: UpdateBookDto) {
  const book = await this.bookRepo.findOne({ where: { id } });
  if (!book) throw new NotFoundException('Book not found');

  const name = dto.name ?? book.name;
  const authorName = dto.authorName ?? book.authorName;

  const existing = await this.bookRepo.findOne({
    where: {
      name,
      authorName,
      id: Not(id),   
    },
  });

  if (existing) {
    throw new ConflictException(
      'Book name and author combination must be unique'
    );
  }

  if (dto.subjectId) {
    const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
  }

  if (dto.languageId) {
    const language = await this.languageRepo.findOne({ where: { id: dto.languageId } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
  }

  Object.assign(book, dto);
  await this.bookRepo.save(book);
  
  return this.findOne(id);
}

  async updateByTutor(id: string, dto: UpdateBookDto, tutorId: string) {
    const book = await this.bookRepo.findOne({ where: { id, createdBy: tutorId } });
    if (!book) throw new NotFoundException('Book not found or not created by you');
    
    const name = dto.name ?? book.name;
    const authorName = dto.authorName ?? book.authorName;

    const existing = await this.bookRepo.findOne({
      where: {
        name,
        authorName,
        id: Not(id),
      },
    });

    if (existing) {
      throw new ConflictException(
        'Book name and author combination must be unique'
      );
    }

    if (dto.subjectId) {
      const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    if (dto.languageId) {
      const language = await this.languageRepo.findOne({ where: { id: dto.languageId } });
      if (!language) {
        throw new NotFoundException('Language not found');
      }
    }

    Object.assign(book, dto);
    await this.bookRepo.save(book);
    
    return this.findOneByTutor(id, tutorId);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const book = await this.findOne(id);
    book.status = dto.status;
    return await this.bookRepo.save(book);
  }

  async updateStatusByTutor(id: string, dto: UpdateStatusDto, tutorId: string) {
    const book = await this.findOneByTutor(id, tutorId);
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

  async updatePdfFile(id: string, filePath: string) {
    const book = await this.findOne(id);
    
    if (book.pdfFilePath) {
      const oldPath = join(__dirname, '..', '..', book.pdfFilePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old PDF file: ${oldPath}`, err.message);
      }
    }
    
    book.pdfFile = process.env.WIZNOVY_CDN_LINK + filePath;
    book.pdfFilePath = filePath;
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

  for (const img of book.bookImages) {
    if (img.imagePath) {
      try {
        unlinkSync(join(process.cwd(), img.imagePath));
      } catch {}
    }
  }

  
  await this.bookImageRepo.delete({ book: { id } });


  const images = files.map(file =>
    this.bookImageRepo.create({
      image: process.env.WIZNOVY_CDN_LINK + file.path,
      imagePath: file.path,
      book,
    }),
  );

  await this.bookImageRepo.save(images);

 
  return await this.bookRepo.createQueryBuilder('book')
    .leftJoinAndSelect('book.bookImages', 'bookImages')
    .leftJoinAndSelect('book.subject', 'subject')
    .leftJoinAndSelect('book.language', 'language')
    .where('book.id = :id', { id })
    .getOne();
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

  async bulkUpdateStatus(dto: BulkBookStatusDto) {
    await this.bookRepo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} books status updated successfully` };
  }

  async remove(id: string) {
    const book = await this.findOne(id);
    await this.bookRepo.remove(book);
    return { message: 'Book deleted successfully' };
  }

  private async generateIsbn(): Promise<string> {
    const lastBook = await this.bookRepo
      .createQueryBuilder('book')
      .where('book.isbn LIKE :pattern', { pattern: 'wiz/book/%' })
      .orderBy('book.isbn', 'DESC')
      .getOne();

    let sequence = 1001;

    if (lastBook?.isbn) {
      const lastSequence = Number.parseInt(lastBook.isbn.split('/')[2], 10);
      if (!Number.isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `wiz/book/${sequence}`;
  }
}
