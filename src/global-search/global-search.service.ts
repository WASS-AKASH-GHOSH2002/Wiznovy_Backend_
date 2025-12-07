import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { GlobalSearchDto } from './dto/global-search.dto';
import { Course } from 'src/course/entities/course.entity';
import { Book } from 'src/book/entities/book.entity';
import { SearchHistory } from 'src/search-history/entities/search-history.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Country } from 'src/country/entities/country.entity';
import { CourseStatus, DefaultStatus, Level } from 'src/enum';


@Injectable()
export class GlobalSearchService {
  constructor(
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
     @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,

        @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepo: Repository<SearchHistory>
  ) {}

async search(dto: GlobalSearchDto, accountId?: string) {
  const { keyword, limit = 10, offset = 0 } = dto;
  const trimmedKeyword = keyword?.trim();
  const lowerKeyword = trimmedKeyword?.toLowerCase() || '';

  const tutorsResult = await this.searchTutors(dto, trimmedKeyword, lowerKeyword, limit, offset);
  const coursesResult = await this.searchCourses(dto, trimmedKeyword, lowerKeyword, limit, offset);
  const booksResult = await this.searchBooks(dto, trimmedKeyword, lowerKeyword, limit, offset);
  const subjectsResult = await this.searchSubjects(dto, trimmedKeyword, lowerKeyword, limit, offset);

  return this.formatSearchResults(lowerKeyword, tutorsResult, coursesResult, booksResult, subjectsResult);
}

private async searchTutors(dto: GlobalSearchDto, trimmedKeyword: string, lowerKeyword: string, limit: number, offset: number) {
  const { rating, subject, level, country, minPrice, maxPrice } = dto;
  
  const query = this.tutorRepo.createQueryBuilder('tutor')
    .leftJoinAndSelect('tutor.account', 'account')
    .leftJoinAndSelect('tutor.subject', 'subject')
    .leftJoinAndSelect('tutor.country', 'country')
    .leftJoinAndSelect('tutor.state', 'state')
    .leftJoinAndSelect('tutor.language', 'language')
    .leftJoinAndSelect('tutor.qualification', 'qualification')
    .leftJoinAndSelect('tutor.city', 'city')
    .select([
      'tutor.id',
      'tutor.name',
      'tutor.dob',
      'tutor.gender',
      'tutor.expertiseLevel',
      'tutor.hourlyRate',
      'tutor.profileImage',
      'tutor.profileImagePath',
      'tutor.bio',
      'tutor.averageRating',
      'tutor.totalRatings',
      'tutor.createdAt',
      'tutor.updatedAt',
      
      'account.id',

      'subject.id',
      'subject.name',

      'country.id',
      'country.name',

      'state.id',
      'state.name',

      'language.id',
      'language.name',

      'qualification.id',
      'qualification.name',
    ])
    .where('account.status = :status', { status: DefaultStatus.ACTIVE });

  this.applyTutorFilters(query, { trimmedKeyword, lowerKeyword, rating, subject, level, country, minPrice, maxPrice });

  const [result, total] = await query.orderBy('tutor.name', 'ASC').skip(offset).take(limit).getManyAndCount();
  return { result, total };
}

private async searchCourses(dto: GlobalSearchDto, trimmedKeyword: string, lowerKeyword: string, limit: number, offset: number) {
  const { rating, subject, minPrice, maxPrice } = dto;
  
  const query = this.courseRepo.createQueryBuilder('course')
    .leftJoinAndSelect('course.tutor', 'tutor')
    .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
    .leftJoinAndSelect('course.subject', 'subject')
    .leftJoinAndSelect('course.language', 'language')
    .select([
      'course.id',
      'course.name',
      'course.description',
      'course.imageUrl',
      'course.thumbnailUrl',
      'course.price',
      'course.discountPrice',
      'course.accessType',
      'course.totalDuration',
      'course.totalLectures',
      'course.validityDays',
      'course.averageRating',
      'course.totalRatings',
      'course.tutorId',
      'course.authorMessage',
      'course.startDate',
      'course.endDate',
      'course.subjectId',
      'course.languageId',
      'course.createdAt',
      'subject.id',
      'subject.name',
      'language.id',
      'language.name',
      'tutorDetail.id',
      'tutorDetail.name'
    ])
    .where('course.status = :status', { status: CourseStatus.APPROVED });

  this.applyCourseFilters(query, trimmedKeyword, lowerKeyword, rating, subject, minPrice, maxPrice);

  const [result, total] = await query.orderBy('course.name', 'ASC').skip(offset).take(limit).getManyAndCount();
  return { result, total };
}

private async searchBooks(dto: GlobalSearchDto, trimmedKeyword: string, lowerKeyword: string, limit: number, offset: number) {
  const { rating } = dto;
  
  const query = this.bookRepo.createQueryBuilder('book')
    .select(['book.id', 'book.name', 'book.authorName', 'book.averageRating', 'book.status', 
     'book.coverImage', 'book.coverImagePath', 
      'book.createdAt', 'book.updatedAt'])
    .where('book.status = :status', { status: DefaultStatus.ACTIVE });

  this.applyBookFilters(query, trimmedKeyword, lowerKeyword, rating);

  const [result, total] = await query.orderBy('book.name', 'ASC').skip(offset).take(limit).getManyAndCount();
  return { result, total };
}

private async searchSubjects(dto: GlobalSearchDto, trimmedKeyword: string, lowerKeyword: string, limit: number, offset: number) {
  const query = this.subjectRepo.createQueryBuilder('subject')
    .select(['subject.id', 'subject.name', 'subject.image', 'subject.imagePath', 'subject.status', 'subject.createdAt', 'subject.updatedAt'])
    .where('subject.status = :status', { status: DefaultStatus.ACTIVE });

  this.applySubjectFilters(query, trimmedKeyword, lowerKeyword);
  
  const [result, total] = await query.orderBy('subject.name', 'ASC').skip(offset).take(limit).getManyAndCount();
  return { result, total };
}

private applyTutorFilters(query: any, options: { trimmedKeyword: string, lowerKeyword: string, rating?: number, subject?: string, level?: string, country?: string, minPrice?: number, maxPrice?: number }) {
  const { trimmedKeyword, lowerKeyword, rating, subject, level, country, minPrice, maxPrice } = options;
  
  if (trimmedKeyword && lowerKeyword !== 'tutor' && lowerKeyword !== 'tutors') {
    query.andWhere(new Brackets(qb => {
      qb.where('LOWER(tutor.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` })
        .orWhere('LOWER(tutor.bio) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` })
        .orWhere('LOWER(subject.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` });
    }));
  }
  if (rating) query.andWhere('tutor.averageRating >= :rating', { rating });
  if (subject) query.andWhere('subject.id = :subject', { subject });
  if (level) query.andWhere('tutor.expertiseLevel = :level', { level });
  if (country) {
    query.andWhere('(country.id = :countryId OR LOWER(country.name) LIKE LOWER(:countryName))', {
      countryId: country,
      countryName: `%${country}%`
    });
  }
  if (minPrice) query.andWhere('tutor.hourlyRate >= :minPrice', { minPrice });
  if (maxPrice) query.andWhere('tutor.hourlyRate <= :maxPrice', { maxPrice });
}

private applyCourseFilters(query: any, trimmedKeyword: string, lowerKeyword: string, rating?: number, subject?: string, minPrice?: number, maxPrice?: number) {
  if (trimmedKeyword && lowerKeyword !== 'course' && lowerKeyword !== 'courses') {
    query.andWhere(new Brackets(qb => {
      qb.where('LOWER(course.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` })
        .orWhere('LOWER(course.description) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` })
        .orWhere('LOWER(subject.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` })
        .orWhere('LOWER(tutorDetail.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` });
    }));
  }
  if (rating) query.andWhere('course.averageRating >= :rating', { rating });
  if (subject) query.andWhere('subject.id = :subject', { subject });
  if (minPrice) query.andWhere('course.price >= :minPrice', { minPrice });
  if (maxPrice) query.andWhere('course.price <= :maxPrice', { maxPrice });
}

private applyBookFilters(query: any, trimmedKeyword: string, lowerKeyword: string, rating?: number) {
  if (trimmedKeyword && lowerKeyword !== 'book' && lowerKeyword !== 'books') {
    query.andWhere('(LOWER(book.name) LIKE LOWER(:keyword) OR LOWER(book.authorName) LIKE LOWER(:keyword))', { keyword: `%${trimmedKeyword}%` });
  }
  if (rating) query.andWhere('book.averageRating >= :rating', { rating });
}

private applySubjectFilters(query: any, trimmedKeyword: string, lowerKeyword: string) {
  if (trimmedKeyword && lowerKeyword !== 'subject' && lowerKeyword !== 'subjects') {
    query.andWhere('LOWER(subject.name) LIKE LOWER(:keyword)', { keyword: `%${trimmedKeyword}%` });
  }
}

private formatSearchResults(lowerKeyword: string, tutorsResult: any, coursesResult: any, booksResult: any, subjectsResult: any) {
  const emptyResult = { result: [], total: 0 };
  
  if (['tutor', 'tutors', 'teacher', 'teachers', 'instructor', 'instructors'].includes(lowerKeyword)) {
    return { tutors: tutorsResult, courses: emptyResult, books: emptyResult, subjects: emptyResult };
  }
  if (['course', 'courses', 'class', 'classes', 'lesson', 'lessons'].includes(lowerKeyword)) {
    return { tutors: emptyResult, courses: coursesResult, books: emptyResult, subjects: emptyResult };
  }
  if (['book', 'books', 'ebook', 'ebooks'].includes(lowerKeyword)) {
    return { tutors: emptyResult, courses: emptyResult, books: booksResult, subjects: emptyResult };
  }
  if (['subject', 'subjects', 'topic', 'topics'].includes(lowerKeyword)) {
    return { tutors: emptyResult, courses: emptyResult, books: emptyResult, subjects: subjectsResult };
  }
  
  return { tutors: tutorsResult, courses: coursesResult, books: booksResult, subjects: subjectsResult };
}

async getSearchSuggestions(keyword: string) {
  const trimmedKeyword = keyword?.trim();
  if (!trimmedKeyword) return [];

  // Keyword mapping for common search terms
  const keywordMap = {
    't': ['tutor', 'teacher', 'training'],
    'c': ['course', 'class', 'curriculum'],
    'b': ['book', 'bibliography'],
    'tutor': ['tutor', 'teacher', 'instructor'],
    'course': ['course', 'class', 'lesson'],
    'book': ['book', 'ebook', 'textbook'],
    'teach': ['tutor', 'teacher', 'teaching'],
    'learn': ['course', 'learning', 'lesson'],
    'study': ['course', 'book', 'study']
  };

  const lowerKeyword = trimmedKeyword.toLowerCase();
  const mappedKeywords = keywordMap[lowerKeyword] || [trimmedKeyword];
  
  const likeKeyword = `%${trimmedKeyword}%`;
  const suggestions = [];

  // Add direct keyword suggestions
  if (lowerKeyword.length <= 2) {
    if ('tutor'.startsWith(lowerKeyword) || 'teacher'.startsWith(lowerKeyword)) {
      suggestions.push({ id: 'tutor-type', name: 'Tutors', type: 'category' });
    }
    if ('course'.startsWith(lowerKeyword) || 'class'.startsWith(lowerKeyword)) {
      suggestions.push({ id: 'course-type', name: 'Courses', type: 'category' });
    }
    if ('book'.startsWith(lowerKeyword)) {
      suggestions.push({ id: 'book-type', name: 'Books', type: 'category' });
    }
  }

  
  const tutors = await this.tutorRepo
    .createQueryBuilder('tutor')
    .leftJoin('tutor.account', 'account')
    .select(['tutor.id', 'tutor.name', 'tutor.bio'])
    .where('account.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere('(LOWER(tutor.name) LIKE LOWER(:keyword) OR LOWER(tutor.bio) LIKE LOWER(:keyword))', {
      keyword: likeKeyword,
    })
    .orderBy('CASE WHEN LOWER(tutor.name) LIKE LOWER(:startKeyword) THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('tutor.name', 'ASC')
    .setParameter('startKeyword', `${trimmedKeyword}%`)
    .limit(3)
    .getMany();

  const courses = await this.courseRepo
    .createQueryBuilder('course')
    .select(['course.id', 'course.name', 'course.description'])
    .where('course.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere('(LOWER(course.name) LIKE LOWER(:keyword) OR LOWER(course.description) LIKE LOWER(:keyword))', {
      keyword: likeKeyword,
    })
    .orderBy('CASE WHEN LOWER(course.name) LIKE LOWER(:startKeyword) THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('course.name', 'ASC')
    .setParameter('startKeyword', `${trimmedKeyword}%`)
    .limit(3)
    .getMany();

  const books = await this.bookRepo
    .createQueryBuilder('book')
    .select(['book.id', 'book.name', 'book.authorName'])
    .where('book.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere('(LOWER(book.name) LIKE LOWER(:keyword) OR LOWER(book.authorName) LIKE LOWER(:keyword))', {
      keyword: likeKeyword,
    })
    .orderBy('CASE WHEN LOWER(book.name) LIKE LOWER(:startKeyword) THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('book.name', 'ASC')
    .setParameter('startKeyword', `${trimmedKeyword}%`)
    .limit(3)
    .getMany();

  const subjects = await this.subjectRepo
    .createQueryBuilder('subject')
    .select(['subject.id', 'subject.name'])
    .where('subject.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere('LOWER(subject.name) LIKE LOWER(:keyword)', {
      keyword: likeKeyword,
    })
    .orderBy('CASE WHEN LOWER(subject.name) LIKE LOWER(:startKeyword) THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('subject.name', 'ASC')
    .setParameter('startKeyword', `${trimmedKeyword}%`)
    .limit(2)
    .getMany();

  const countries = await this.countryRepo
    .createQueryBuilder('country')
    .select(['country.id', 'country.name'])
    .where('country.status = :status', { status: DefaultStatus.ACTIVE })
    .andWhere('LOWER(country.name) LIKE LOWER(:keyword)', {
      keyword: likeKeyword,
    })
    .orderBy('CASE WHEN LOWER(country.name) LIKE LOWER(:startKeyword) THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('country.name', 'ASC')
    .setParameter('startKeyword', `${trimmedKeyword}%`)
    .limit(2)
    .getMany();

  suggestions.push(
    ...tutors.map(t => ({ name: t.name, type: 'tutor' })),
    ...courses.map(c => ({ name: c.name, type: 'course' })),
    ...books.map(b => ({ name: b.name, type: 'book' })),
    ...books.map(b => ({ name: b.authorName, type: 'author' })).filter(s => s.name),
    ...subjects.map(s => ({ name: s.name, type: 'subject' })),
    ...countries.map(c => ({ name: c.name, type: 'country' }))
  );

  const uniqueSuggestions = suggestions
    .filter(s => {
      if (!s.name) return false;
      const itemName = s.name.toLowerCase();
      // Check if item matches original keyword or any mapped keywords
      return itemName.includes(trimmedKeyword.toLowerCase()) || 
             mappedKeywords.some(mk => itemName.includes(mk.toLowerCase()) || mk.toLowerCase().includes(itemName));
    })
    .filter((item, index, self) => 
      index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
    )
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const keyword = trimmedKeyword.toLowerCase();
      
      // Priority 1: Items that start with the keyword
      const aStarts = aName.startsWith(keyword);
      const bStarts = bName.startsWith(keyword);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Priority 2: Alphabetical order
      return aName.localeCompare(bName);
    })
    .slice(0, 15)
    .map((item, index) => ({
      id: (index + 1).toString(),
      name: item.name,
      type: item.type
    }));

  return uniqueSuggestions;
}


 

 

  async getTotalCountPerSubject() {
    try {
      const tutorCounts = await this.tutorRepo
        .createQueryBuilder('tutor')
        .select('tutor.subjectId', 'subjectId')
        .addSelect('COUNT(tutor.id)', 'tutorCount')
        .groupBy('tutor.subjectId')
        .getRawMany();

    
      const courseCounts = await this.courseRepo
        .createQueryBuilder('course')
        .select('course.subjectId', 'subjectId')
        .addSelect('COUNT(course.id)', 'courseCount')
        .groupBy('course.subjectId')
        .getRawMany();

      
      const subjects = await this.subjectRepo.find({ select: ['id', 'name'] });

      
      return subjects.map((subj) => {
        const tutor = tutorCounts.find((t) => t.subjectId === subj.id);
        const course = courseCounts.find((c) => c.subjectId === subj.id);

        const totalCount = Number(tutor?.tutorCount || 0) + Number(course?.courseCount || 0);

        return {
          subjectId: subj.id,
          subjectName: subj.name,
          totalCount,
        };
      });
    } catch (err) {
      console.error('Error fetching total counts per subject:', err);
      throw new InternalServerErrorException('Failed to fetch total counts per subject');
    }
  }

  
  async getTutorCountPerCountry() {
    try {
      
      const tutorCounts = await this.tutorRepo
        .createQueryBuilder('tutor')
        .select('tutor.countryId', 'countryId')
        .addSelect('COUNT(tutor.id)', 'tutorCount')
        .groupBy('tutor.countryId')
        .getRawMany();

      
      const countries = await this.countryRepo.find({ select: ['id', 'name'] });

      // 3️⃣ Merge counts
      return countries.map((country) => {
        const tutor = tutorCounts.find((t) => t.countryId === country.id);
        return {
          countryId: country.id,
          countryName: country.name,
          tutorCount: Number(tutor?.tutorCount || 0),
        };
      });
    } catch (err) {
      console.error('Error fetching tutor counts per country:', err);
      throw new InternalServerErrorException('Failed to fetch tutor counts per country');
    }
  }

    async getExpertiseLevelCount() {
    const result = await this.tutorRepo
      .createQueryBuilder('tutor')
      .select('tutor.expertiseLevel', 'expertiseLevel')
      .addSelect('COUNT(tutor.id)', 'count')
      .groupBy('tutor.expertiseLevel')
      .getRawMany();

    
    const levels = Object.values(Level);
    const formatted = levels.map((level) => {
      const found = result.find((r) => r.expertiseLevel === level);
      return { level, count: found ? Number(found.count) : 0 };
    });

    return formatted;
  }



}
