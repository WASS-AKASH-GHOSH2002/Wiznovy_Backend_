import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, SelectQueryBuilder } from 'typeorm';
import { Book } from './entities/book.entity';
import { BookImage } from './entities/book-image.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Language } from 'src/languages/entities/language.entity';
import { SavedBook } from 'src/saved-books/entities/saved-book.entity';
import { CreateBookDto, BookPaginationDto, UpdateStatusDto, BulkBookStatusDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Shared Query Builder ────────────────────────────────────────────────────

  private buildBookQuery(withTutor = false): SelectQueryBuilder<Book> {
    const qb = this.bookRepo.createQueryBuilder('book')
      .leftJoin('book.bookImages', 'bookImages')
      .leftJoin('book.subject', 'subject')
      .leftJoin('book.language', 'language')
      .select([
        'book.id', 'book.name', 'book.authorName', 'book.description',
        'book.coverImage', 'book.isbn', 'book.pdfFile', 'book.totalPages',
        'book.status', 'book.averageRating', 'book.totalRatings',
        'book.createdBy', 'book.createdAt', 'book.updatedAt',
        'bookImages.id', 'bookImages.image',
        'subject.id', 'subject.name',
        'language.id', 'language.name',
      ]);

    if (withTutor) {
      qb.leftJoin('book.tutor', 'tutor')
        .leftJoin('tutor.tutorDetail', 'tutorDetail')
        .addSelect([
          'tutor.id',
          'tutorDetail.id', 'tutorDetail.name', 'tutorDetail.dob', 'tutorDetail.gender',
          'tutorDetail.expertiseLevel', 'tutorDetail.hourlyRate', 'tutorDetail.profileImage',
          'tutorDetail.profileImagePath', 'tutorDetail.bio', 'tutorDetail.averageRating',
          'tutorDetail.totalRatings', 'tutorDetail.createdAt', 'tutorDetail.updatedAt',
        ]);
    }

    return qb;
  }

  private applyBookFilters(qb: SelectQueryBuilder<Book>, dto: BookPaginationDto) {
    if (dto.keyword) {
      qb.andWhere(new Brackets(qb2 => {
        qb2.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
           .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }
    if (dto.status) qb.andWhere('book.status = :status', { status: dto.status });
    if (dto.languageId) qb.andWhere('book.languageId = :languageId', { languageId: dto.languageId });
    if (dto.subjectId) qb.andWhere('book.subjectId = :subjectId', { subjectId: dto.subjectId });
  }

  private applyPagination(qb: SelectQueryBuilder<Book>, dto: BookPaginationDto) {
    return qb.orderBy('book.createdAt', 'DESC').skip(dto.offset || 0).take(dto.limit || 10);
  }

  // ─── Duplicate Check ─────────────────────────────────────────────────────────

  private async checkBookDuplicate(name: string, authorName: string, excludeId?: string) {
    const qb = this.bookRepo.createQueryBuilder('book')
      .where('book.name = :name', { name })
      .andWhere('book.authorName = :authorName', { authorName });
    if (excludeId) qb.andWhere('book.id != :excludeId', { excludeId });
    const existing = await qb.getOne();
    if (existing) throw new ConflictException('Book name and author combination must be unique');
  }

  // ─── Validate Relations ───────────────────────────────────────────────────────

  private async validateRelations(dto: UpdateBookDto | CreateBookDto) {
    if (dto.subjectId) {
      const subject = await this.subjectRepo.findOne({ where: { id: dto.subjectId } });
      if (!subject) throw new NotFoundException('Subject not found');
    }
    if (dto.languageId) {
      const language = await this.languageRepo.findOne({ where: { id: dto.languageId } });
      if (!language) throw new NotFoundException('Language not found');
    }
  }

  // ─── File Helpers ─────────────────────────────────────────────────────────────

  private deleteFile(filePath: string) {
    try {
      unlinkSync(join(__dirname, '..', '..', filePath));
    } catch (err) {
      console.warn(`Failed to delete file: ${filePath}`, err.message);
    }
  }

  private async updateFileField(
    entity: Book | BookImage,
    pathField: string,
    urlField: string,
    filePath: string,
    repo: Repository<any>,
  ) {
    if (entity[pathField]) this.deleteFile(entity[pathField]);
    entity[urlField] = process.env.WIZNOVY_CDN_LINK + filePath;
    entity[pathField] = filePath;
    return repo.save(entity);
  }

  // ─── Saved Books Helper ───────────────────────────────────────────────────────

  private async attachSavedStatus<T extends { id: string }>(books: T[], userId: string): Promise<(T & { isSaved: boolean })[]> {
    if (!books.length) return books.map(b => ({ ...b, isSaved: false }));
    const saved = await this.savedBookRepo.find({
      where: { userId, bookId: In(books.map(b => b.id)) },
      select: ['bookId'],
    });
    const savedIds = new Set(saved.map(s => s.bookId));
    return books.map(b => ({ ...b, isSaved: savedIds.has(b.id) }));
  }

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateBookDto) {
    await this.checkBookDuplicate(dto.name, dto.authorName);
    const isbn = await this.generateIsbn();
    return this.bookRepo.save(this.bookRepo.create({ ...dto, isbn }));
  }

  async createByTutor(dto: CreateBookDto, tutorId: string) {
    await this.checkBookDuplicate(dto.name, dto.authorName);
    const isbn = await this.generateIsbn();
    const saved = await this.bookRepo.save(this.bookRepo.create({ ...dto, createdBy: tutorId, isbn }));
    await this.notificationsService.notifyBookSubmittedForReview(tutorId, saved.name);
    return saved;
  }

  // ─── Find All ─────────────────────────────────────────────────────────────────

  async findAll(dto: BookPaginationDto) {
    const qb = this.buildBookQuery(true);
    if (dto.keyword) {
      qb.andWhere(new Brackets(qb2 => {
        qb2.where('book.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
           .orWhere('book.authorName LIKE :keyword', { keyword: `%${dto.keyword}%` })
           .orWhere('book.description LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }
    if (dto.status) qb.andWhere('book.status = :status', { status: dto.status });
    if (dto.languageId) qb.andWhere('book.languageId = :languageId', { languageId: dto.languageId });
    if (dto.subjectId) qb.andWhere('book.subjectId = :subjectId', { subjectId: dto.subjectId });

    const [result, total] = await this.applyPagination(qb, dto).getManyAndCount();
    return { result, total };
  }

  async findByUser(dto: BookPaginationDto, userId: string) {
    const qb = this.buildBookQuery(true).where('book.status = :status', { status: 'APPROVED' });
    this.applyBookFilters(qb, { ...dto, status: undefined });
    if (dto.tutorId) qb.andWhere('book.createdBy = :tutorId', { tutorId: dto.tutorId });

    const [books, total] = await this.applyPagination(qb, dto).getManyAndCount();
    const result = await this.attachSavedStatus(books, userId);
    return { result, total };
  }

  async findByTutor(dto: BookPaginationDto, tutorId: string) {
    const qb = this.buildBookQuery().where('book.createdBy = :tutorId', { tutorId });
    this.applyBookFilters(qb, dto);
    const [result, total] = await this.applyPagination(qb, dto).getManyAndCount();
    return { result, total };
  }

  // ─── Find One ─────────────────────────────────────────────────────────────────

  private async getRelatedBooks(createdBy: string, excludeId: string) {
    if (!createdBy) return [];
    return this.buildBookQuery()
      .where('book.createdBy = :createdBy', { createdBy })
      .andWhere('book.id != :id', { id: excludeId })
      .andWhere('book.status = :status', { status: 'APPROVED' })
      .limit(5)
      .getMany();
  }

  async findOne(id: string) {
    const book = await this.buildBookQuery(true).where('book.id = :id', { id }).getOne();
    if (!book) throw new NotFoundException('Book not found');
    const relatedBooks = await this.getRelatedBooks(book.createdBy, id);
    return { ...book, relatedBooks };
  }

  async findOneByUser(id: string, userId: string) {
    const book = await this.buildBookQuery(true)
      .where('book.id = :id', { id })
      .andWhere('book.status = :status', { status: 'APPROVED' })
      .getOne();
    if (!book) throw new NotFoundException('Book not found');

    const [savedBook, relatedBooks] = await Promise.all([
      this.savedBookRepo.findOne({ where: { userId, bookId: id } }),
      this.getRelatedBooks(book.createdBy, id),
    ]);

    const relatedBooksWithSaved = await this.attachSavedStatus(relatedBooks, userId);
    return { ...book, isSaved: !!savedBook, relatedBooks: relatedBooksWithSaved };
  }

  async findOneByTutor(id: string, tutorId: string) {
    const book = await this.buildBookQuery()
      .where('book.id = :id', { id })
      .andWhere('book.createdBy = :tutorId', { tutorId })
      .getOne();
    if (!book) throw new NotFoundException('Book not found or not created by you');
    return book;
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  private async applyBookUpdate(book: Book, dto: UpdateBookDto) {
    const name = dto.name ?? book.name;
    const authorName = dto.authorName ?? book.authorName;
    await this.checkBookDuplicate(name, authorName, book.id);
    await this.validateRelations(dto);
    Object.assign(book, dto);
    return this.bookRepo.save(book);
  }

  async update(id: string, dto: UpdateBookDto) {
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    await this.applyBookUpdate(book, dto);
    return this.findOne(id);
  }

  async updateByTutor(id: string, dto: UpdateBookDto, tutorId: string) {
    const book = await this.bookRepo.findOne({ where: { id, createdBy: tutorId } });
    if (!book) throw new NotFoundException('Book not found or not created by you');
    await this.applyBookUpdate(book, dto);
    return this.findOneByTutor(id, tutorId);
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const book = await this.findOne(id);
    book.status = dto.status;
    return this.bookRepo.save(book);
  }

  async updateStatusByTutor(id: string, dto: UpdateStatusDto, tutorId: string) {
    const book = await this.findOneByTutor(id, tutorId);
    book.status = dto.status;
    return this.bookRepo.save(book);
  }

  // ─── File Updates ─────────────────────────────────────────────────────────────

  async updateCoverImage(id: string, filePath: string) {
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return this.updateFileField(book, 'coverImagePath', 'coverImage', filePath, this.bookRepo);
  }

  async updatePdfFile(id: string, filePath: string) {
    const book = await this.bookRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return this.updateFileField(book, 'pdfFilePath', 'pdfFile', filePath, this.bookRepo);
  }

  async updateBookImage(imageId: string, filePath: string) {
    const bookImage = await this.bookImageRepo.findOne({ where: { id: imageId } });
    if (!bookImage) throw new NotFoundException('Book image not found');
    return this.updateFileField(bookImage, 'imagePath', 'image', filePath, this.bookImageRepo);
  }

  // ─── Image Management ─────────────────────────────────────────────────────────

  async addImages(id: string, files: Express.Multer.File[]) {
    const book = await this.findOne(id);
    const images = files.map(file =>
      this.bookImageRepo.create({
        image: process.env.WIZNOVY_CDN_LINK + file.path,
        imagePath: file.path,
        book,
      }),
    );
    return this.bookImageRepo.save(images);
  }

  async replaceAllImages(id: string, files: Express.Multer.File[]) {
    const book = await this.findOne(id);
    for (const img of book.bookImages) {
      if (img.imagePath) this.deleteFile(img.imagePath);
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
    return this.bookRepo.createQueryBuilder('book')
      .leftJoinAndSelect('book.bookImages', 'bookImages')
      .leftJoinAndSelect('book.subject', 'subject')
      .leftJoinAndSelect('book.language', 'language')
      .where('book.id = :id', { id })
      .getOne();
  }

  async deleteBookImage(imageId: string) {
    const bookImage = await this.bookImageRepo.findOne({ where: { id: imageId } });
    if (!bookImage) throw new NotFoundException('Book image not found');
    if (bookImage.imagePath) this.deleteFile(bookImage.imagePath);
    await this.bookImageRepo.remove(bookImage);
    return { message: 'Book image deleted successfully' };
  }

  async manageImages(id: string, action: 'add' | 'replace' | 'update' | 'delete', imageId?: string, files?: Express.Multer.File[]) {
    switch (action) {
      case 'add': return this.addImages(id, files);
      case 'replace': return this.replaceAllImages(id, files);
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

  // ─── Bulk & Remove ────────────────────────────────────────────────────────────

  async bulkUpdateStatus(dto: BulkBookStatusDto) {
    await this.bookRepo.update({ id: In(dto.ids) }, { status: dto.status });
    return { message: `${dto.ids.length} books status updated successfully` };
  }

  async remove(id: string) {
    const book = await this.findOne(id);
    await this.bookRepo.remove(book);
    return { message: 'Book deleted successfully' };
  }

  // ─── ISBN Generator ───────────────────────────────────────────────────────────

  private async generateIsbn(): Promise<string> {
    const lastBook = await this.bookRepo
      .createQueryBuilder('book')
      .where('book.isbn LIKE :pattern', { pattern: 'wiz/book/%' })
      .orderBy('book.isbn', 'DESC')
      .getOne();

    let sequence = 1001;
    if (lastBook?.isbn) {
      const last = Number.parseInt(lastBook.isbn.split('/')[2], 10);
      if (!Number.isNaN(last)) sequence = last + 1;
    }
    return `wiz/book/${sequence}`;
  }
}
