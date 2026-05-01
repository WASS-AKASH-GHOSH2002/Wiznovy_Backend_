import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { CreateRatingDto, CreateSessionReviewDto, RatingFilterDto, } from './dto/rating.dto';
import { Account } from 'src/account/entities/account.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { Course } from 'src/course/entities/course.entity';
import { Session } from 'src/session/entities/session.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

import { NotificationType, RatingType, UserRole } from 'src/enum';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateRatingDto, accountId: string) {
    await this.validateAccount(accountId);
    const tutorEntity = await this.validateTutorRating(dto, accountId);
    await this.validateCourseRating(dto, accountId);
    await this.validateSessionRating(dto, accountId);

    const ratingData = {
      accountId,
      rating: dto.rating,
      comment: dto.comment,
      type: dto.courseId ? RatingType.COURSE : dto.sessionId ? RatingType.SESSION : RatingType.TUTOR,
      tutorId: tutorEntity?.accountId || null,
      courseId: dto.courseId || null,
      sessionId: dto.sessionId || null,
    };

    const savedRating = await this.ratingRepo.save(ratingData);
    await this.updateRatings(tutorEntity, dto.courseId);

    if (tutorEntity) {
      const reviewer = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['userDetail'] });
      const studentName = reviewer?.userDetail?.[0]?.name || 'A student';
      const subject = tutorEntity.subjectId ? (await this.sessionRepo.manager.findOne('Subject', { where: { id: tutorEntity.subjectId } }) as any)?.name || 'your session' : 'your session';
      await this.notificationsService.create({
        title: 'New Review',
        desc: `${studentName} gave you ${dto.rating} stars for ${subject}. Tap to view.`,
        type: NotificationType.RATING,
        accountId: tutorEntity.accountId,
      });
    }

    return savedRating;
  }

  private async validateAccount(accountId: string) {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, roles: UserRole.USER },
    });
    if (!account) throw new NotFoundException('Account not found');
  }

  private async validateTutorRating(dto: CreateRatingDto, accountId: string) {
    if (!dto.tutorId) return null;

    const tutorEntity = await this.tutorRepo.findOne({ where: { accountId: dto.tutorId } });
    if (!tutorEntity) throw new NotFoundException('Tutor not found');

    const existingRating = await this.ratingRepo.findOne({
      where: { accountId, tutorId: tutorEntity.accountId },
    });
    if (existingRating) throw new ConflictException('You have already rated this tutor');
    
    return tutorEntity;
  }

  private async validateCourseRating(dto: CreateRatingDto, accountId: string) {
    if (!dto.courseId) return;

    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existingRating = await this.ratingRepo.findOne({
      where: { accountId, courseId: dto.courseId },
    });
    if (existingRating) throw new ConflictException('You have already rated this course');
  }

  private async validateSessionRating(dto: CreateRatingDto, accountId: string) {
    if (!dto.sessionId) return;

    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    const existingRating = await this.ratingRepo.findOne({
      where: { accountId, sessionId: dto.sessionId },
    });
    if (existingRating) throw new ConflictException('You have already rated this session');
  }

  private async updateRatings(tutorEntity: any, courseId?: string) {
    if (tutorEntity) await this.updateTutorRatings(tutorEntity.id);
    if (courseId) await this.updateCourseRatings(courseId);
  }

  async createSessionReview(dto: CreateSessionReviewDto, accountId: string) {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, roles: UserRole.USER },
    });
    if (!account) throw new NotFoundException('Account not found');

    const session = await this.sessionRepo.findOne({ 
      where: { id: dto.sessionId },
      relations: ['tutor']
    });
    if (!session) throw new NotFoundException('Session not found');

    const existingRating = await this.ratingRepo.findOne({
      where: { accountId, sessionId: dto.sessionId },
    });
    if (existingRating) throw new ConflictException('You have already rated this session');

    const ratingData = {
      accountId,
      rating: dto.rating,
      comment: dto.comment,
      type: RatingType.SESSION,
      sessionId: dto.sessionId,
      tutorId: session.tutorId,
    };

    const savedRating = await this.ratingRepo.save(ratingData);

    const tutor = await this.tutorRepo.findOne({ where: { accountId: session.tutorId } });
    if (tutor) await this.updateTutorRatings(tutor.id);

    const reviewer = await this.accountRepo.findOne({ where: { id: accountId }, relations: ['userDetail'] });
    const studentName = reviewer?.userDetail?.[0]?.name || 'A student';
    const subjectName = tutor?.subjectId ? (await this.sessionRepo.manager.findOne('Subject', { where: { id: tutor.subjectId } }) as any)?.name || 'your session' : 'your session';
    await this.notificationsService.create({
      title: 'New Review',
      desc: `${studentName} gave you ${dto.rating} stars for ${subjectName}. Tap to view.`,
      type: NotificationType.RATING,
      accountId: session.tutorId,
    });

    return savedRating;
  }

 async getSessionReviews(dto: RatingFilterDto, currentUserId?: string) {
  const queryBuilder = this.ratingRepo.createQueryBuilder('rating')
    .leftJoinAndSelect('rating.account', 'account')
    .leftJoinAndSelect('account.userDetail', 'userDetail')
    .leftJoinAndSelect('rating.session', 'session')
    .leftJoinAndSelect('rating.tutor', 'tutor') 
    .leftJoinAndSelect('tutor.userDetail', 'tutorDetail')
    .where('rating.sessionId IS NOT NULL') 

    .select([
      'rating.id',
      'rating.accountId',
      'rating.rating',
      'rating.comment',
      'rating.createdAt',
      'rating.tutorId',
      'account.id',
      'userDetail.name',
      'session.id',
      'session.sessionDate',
      'session.startTime',
      'tutorDetail.name'
    ]);

 
  if (currentUserId) {
    queryBuilder.andWhere('rating.tutorId = :tutorId', { tutorId: currentUserId });
  }

  if (dto.keyword) {
    queryBuilder.andWhere('rating.comment LIKE :keyword', { keyword: `%${dto.keyword}%` });
  }

  const [result, total] = await queryBuilder
    .orderBy('rating.createdAt', 'DESC')
    .skip(dto.offset || 0)
    .take(dto.limit || 10)
    .getManyAndCount();

  return { result, total };
}


  async findAll(dto: RatingFilterDto) {
    const queryBuilder = this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('rating.session', 'session')
      .leftJoin('rating.course', 'course')
      .leftJoin('rating.tutor', 'tutorAccount')
      .leftJoin('tutorAccount.tutorDetail', 'tutorDetail')
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.tutorId',
        'rating.courseId',
        'rating.sessionId',
        'rating.createdAt',
        'account.id',
        'userDetail.name',
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'course.id',
        'course.name',
        'tutorAccount.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
      ]);

    if (dto.accountId)
      queryBuilder.andWhere('rating.accountId = :accountId', { accountId: dto.accountId });
    if (dto.rating)
      queryBuilder.andWhere('rating.rating = :rating', { rating: dto.rating });
    if (dto.type)
      queryBuilder.andWhere('rating.type = :type', { type: dto.type });
    if (dto.fromDate && dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      queryBuilder.andWhere('DATE(rating.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) <= :toDate', { toDate: dto.toDate });
    if (dto.keyword)
      queryBuilder.andWhere(
        '(rating.comment LIKE :keyword OR course.name LIKE :keyword OR tutorDetail.name LIKE :keyword)',
        { keyword: `%${dto.keyword}%` }
      );

    const [result, total] = await queryBuilder
      .orderBy('rating.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async findById(id: string) {
    const rating = await this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('rating.session', 'session')
      .leftJoin('rating.course', 'course')
      .leftJoin('rating.tutor', 'tutorAccount')
      .leftJoin('tutorAccount.tutorDetail', 'tutorDetail')
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.tutorId',
        'rating.courseId',
        'rating.sessionId',
        'rating.accountId',
        'rating.createdAt',
        'rating.updatedAt',
        'account.id',
        'account.email',
        'userDetail.name',
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'session.endTime',
        'session.duration',
        'session.sessionType',
        'course.id',
        'course.name',
        'course.averageRating',
        'course.totalRatings',
        'tutorAccount.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
        'tutorDetail.tutorId',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
      ])
      .where('rating.id = :id', { id })
      .getOne();

    if (!rating) throw new NotFoundException('Rating not found');
    return rating;
  }

  async deleteRating(id: string) {
    const rating = await this.ratingRepo.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('Rating not found');
    await this.ratingRepo.remove(rating);
    await this.updateRatings(
      rating.tutorId ? await this.tutorRepo.findOne({ where: { accountId: rating.tutorId } }) : null,
      rating.courseId,
    );
    return { message: 'Rating deleted successfully' };
  }

  async updateRating(id: string, dto: Partial<CreateRatingDto>) {
    const rating = await this.ratingRepo.findOne({ where: { id } });
    if (!rating) throw new NotFoundException('Rating not found');
    Object.assign(rating, dto);
    const saved = await this.ratingRepo.save(rating);
    await this.updateRatings(
      rating.tutorId ? await this.tutorRepo.findOne({ where: { accountId: rating.tutorId } }) : null,
      rating.courseId,
    );
    return saved;
  }

  async updateTutorRatings(tutorDetailId: string) {
    const tutorDetail = await this.tutorRepo.findOne({ where: { id: tutorDetailId } });
    if (!tutorDetail) return;

    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'averageRating')
      .addSelect('COUNT(rating.id)', 'totalRatings')
      .where('rating.tutorId = :tutorId', { tutorId: tutorDetail.accountId })
      .getRawOne();

    const averageRating = Number.parseFloat(result?.averageRating) || 0;
    const totalRatings = Number.parseInt(result?.totalRatings) || 0;

    await this.tutorRepo.update({ id: tutorDetailId }, {
      averageRating,
      totalRatings,
    });
  }

  async updateCourseRatings(courseId: string) {
    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'averageRating')
      .addSelect('COUNT(rating.id)', 'totalRatings')
      .where('rating.courseId = :courseId', { courseId })
      .getRawOne();

    const averageRating = Number.parseFloat(result.averageRating) || 0;
    const totalRatings = Number.parseInt(result.totalRatings) || 0;

    const courseUpdate = this.courseRepo.create({
      id: courseId,
      averageRating,
      totalRatings
    });
    
    await this.courseRepo.save(courseUpdate);
  }

  async getGlobalRatingSummary() {
    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('rating.rating', 'rating')
      .addSelect('COUNT(rating.id)', 'count')
      .groupBy('rating.rating')
      .orderBy('rating.rating', 'DESC')
      .getRawMany();

    const distribution = [5, 4, 3, 2, 1].map((rate) => {
      const found = result.find((r) => Number(r.rating) === rate);
      return { rating: rate, count: found ? Number(found.count) : 0 };
    });

    const totalRatings = distribution.reduce((sum, r) => sum + r.count, 0);
    const averageRating =
      totalRatings === 0
        ? 0
        : Number(
            (
              distribution.reduce(
                (sum, r) => sum + r.rating * r.count,
                0,
              ) / totalRatings
            ).toFixed(2),
          );

    return {
      averageRating,
      totalRatings,
      distribution,
    };
  }

  async getMyRatings(accountId: string, dto: RatingFilterDto) {
    const queryBuilder = this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.session', 'session')
      .leftJoin('rating.course', 'course')
      .leftJoin('rating.tutor', 'tutorAccount')
      .leftJoin('tutorAccount.tutorDetail', 'tutorDetail')
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.tutorId',
        'rating.courseId',
        'rating.sessionId',
        'rating.createdAt',
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'course.id',
        'course.name',
        'tutorAccount.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
      ])
      .where('rating.accountId = :accountId', { accountId });

    if (dto.type)
      queryBuilder.andWhere('rating.type = :type', { type: dto.type });
    if (dto.rating)
      queryBuilder.andWhere('rating.rating = :rating', { rating: dto.rating });
    if (dto.fromDate && dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      queryBuilder.andWhere('DATE(rating.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) <= :toDate', { toDate: dto.toDate });

    const [result, total] = await queryBuilder
      .orderBy('rating.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async getCourseRatings(courseId: string, dto: RatingFilterDto) {
    const queryBuilder = this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.createdAt',
        'account.id',
        'userDetail.name',
      ])
      .where('rating.courseId = :courseId', { courseId });

    if (dto.rating)
      queryBuilder.andWhere('rating.rating = :rating', { rating: dto.rating });
    if (dto.keyword)
      queryBuilder.andWhere('rating.comment LIKE :keyword', { keyword: `%${dto.keyword}%` });
    if (dto.fromDate && dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      queryBuilder.andWhere('DATE(rating.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) <= :toDate', { toDate: dto.toDate });

    const [result, total] = await queryBuilder
      .orderBy('rating.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  

  async getTutorReviewsByCode(tutorCode: string, dto: RatingFilterDto) {
    const tutor = await this.tutorRepo.findOne({ where: { tutorId: tutorCode } });
    if (!tutor) throw new NotFoundException('Tutor not found');
    return this.getTutorReviewsById(tutor.accountId, dto);
  }

  async getTutorReviewsById(tutorAccountId: string, dto: RatingFilterDto) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId: tutorAccountId } });
    if (!tutor) throw new NotFoundException('Tutor not found');
    console.log("akash");

    const qb = this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
  
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.createdAt',
        'account.id',
        'userDetail.name',
      
      ])
      .where('rating.tutorId = :tutorId', { tutorId: tutorAccountId });

    if (dto.type)    qb.andWhere('rating.type = :type', { type: dto.type });
    if (dto.rating)  qb.andWhere('rating.rating = :rating', { rating: dto.rating });
    if (dto.keyword) qb.andWhere('rating.comment LIKE :keyword', { keyword: `%${dto.keyword}%` });
    if (dto.fromDate && dto.toDate)
      qb.andWhere('DATE(rating.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      qb.andWhere('DATE(rating.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      qb.andWhere('DATE(rating.createdAt) <= :toDate', { toDate: dto.toDate });

    const [result, total] = await qb
      .orderBy('rating.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async getTutorSessionReviews(tutorAccountId: string, dto: RatingFilterDto) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId: tutorAccountId } });
    if (!tutor) throw new NotFoundException('Tutor not found');

    const queryBuilder = this.ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .select([
        'rating.id',
        'rating.rating',
        'rating.comment',
        'rating.type',
        'rating.createdAt',
        'account.id',
        'userDetail.name',
  
      ])
      .where('rating.tutorId = :tutorId', { tutorId: tutorAccountId });

    if (dto.type)
      queryBuilder.andWhere('rating.type = :type', { type: dto.type });
    if (dto.rating)
      queryBuilder.andWhere('rating.rating = :rating', { rating: dto.rating });
    if (dto.keyword)
      queryBuilder.andWhere('rating.comment LIKE :keyword', { keyword: `%${dto.keyword}%` });
    if (dto.fromDate && dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      queryBuilder.andWhere('DATE(rating.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      queryBuilder.andWhere('DATE(rating.createdAt) <= :toDate', { toDate: dto.toDate });

    const [result, total] = await queryBuilder
      .orderBy('rating.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }
}