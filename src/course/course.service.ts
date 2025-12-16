import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, } from 'typeorm';
import { Course } from './entities/course.entity';
import { Account } from '../account/entities/account.entity';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateCourseDto, UpdateCourseDto, CoursePaginationDto } from './dto/create-course.dto';
import { DefaultStatus, UserRole, NotificationType, AccessTypes, PurchaseType, PaymentStatus, CourseStatus } from '../enum';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { CourseStatusDto } from './dto/course-status.dto';
import { UserPurchase } from 'src/user-purchase/entities/user-purchase.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly repo: Repository<Course>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(UserPurchase)
    private readonly userPurchaseRepo: Repository<UserPurchase>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    private readonly notificationsService: NotificationsService,
   
  ) { }

  async create(dto: CreateCourseDto, currentUserId: string, files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }) {
    const currentUser = await this.accountRepo.findOne({ where: { id: currentUserId } });
    
    let tutorAccountId: string;
    
    if (currentUser.roles === UserRole.ADMIN || currentUser.roles === UserRole.STAFF) {
      if (!dto.tutorId) {
        throw new ConflictException('Admin must provide tutorId');
      }
      const tutor = await this.tutorRepo.findOne({ where: { accountId: dto.tutorId } });
      if (!tutor) {
        throw new ConflictException('Invalid tutorId provided');
      }
      tutorAccountId = dto.tutorId; 
    } else {
      const tutor = await this.tutorRepo.findOne({ where: { accountId: currentUserId } });
      if (!tutor) {
        throw new ConflictException('Only tutors can create courses');
      }
      tutorAccountId = currentUserId; // Use the account ID, not tutor detail ID
    }

    
    const { tutorId, ...courseData } = dto;
    const courseObj: any = Object.assign(courseData, { tutorId: tutorAccountId });
    
    if (files?.image?.[0]) {
      courseObj.imageUrl = process.env.WIZNOVY_CDN_LINK + files.image[0].path;
      courseObj.imagepath = files.image[0].path;
    }
    
    if (files?.thumbnail?.[0]) {
      courseObj.thumbnailUrl = process.env.WIZNOVY_CDN_LINK + files.thumbnail[0].path;
      courseObj.thumbnailpath = files.thumbnail[0].path;
    }
    
    const course = await this.repo.save(courseObj);
    
    await this.notifyAllUsers(course);
    
    return course;
  }


  async getFullCourseById(id: string) {
    const course = await this.repo.createQueryBuilder('course')
      .leftJoinAndSelect('course.units', 'units')
      .leftJoinAndSelect('units.videoLectures', 'videoLectures')
      .leftJoinAndSelect('videoLectures.studyMaterials', 'studyMaterials')
      .leftJoinAndSelect('units.studyMaterials', 'unitStudyMaterials')
      .where('course.id = :id', { id })
      .getOne();

    if (!course) throw new NotFoundException('Course not found');
    return course;
  }


  async findAll(dto: CoursePaginationDto) {
    const queryBuilder = this.repo.createQueryBuilder('course')
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
        'course.validityDays',
        'course.status',
        'course.totalDuration',
        'course.totalLectures',
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
        'tutor.id',
        'tutorDetail.tutorId',
        'tutorDetail.name'

      ]);

    if (dto.status) {
      queryBuilder.andWhere('course.status = :status', { status: dto.status });
    }

    if (dto.accessType) {
      queryBuilder.andWhere('course.accessType = :accessType', { accessType: dto.accessType });
    }
    if (dto.subjectId) {
      queryBuilder.andWhere('course.subjectId = :subjectId', { subjectId: dto.subjectId });
    }
    if (dto.languageId) {
      queryBuilder.andWhere('course.languageId = :languageId', { languageId: dto.languageId });
    }
    if(dto.tutorId){
      queryBuilder.andWhere('course.tutorId = :tutorId', { tutorId: dto.tutorId });
    }

    if (dto.keyword) {
      queryBuilder.andWhere('course.name LIKE :keyword OR course.description LIKE :keyword', {
        keyword: `%${dto.keyword}%`
      });
    }

    if (dto.tutorId) {
      queryBuilder.andWhere('course.tutorId = :tutorId', { tutorId: dto.tutorId });
    }

    const [result, total] = await queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async getMyCourses(dto: CoursePaginationDto, tutorId: string) {
    const queryBuilder = this.repo.createQueryBuilder('course')
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
        'course.validityDays',
        'course.status',
        'course.totalDuration',
        'course.totalLectures',
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
      ])
      .where('course.tutorId = :tutorId', { tutorId });

    if (dto.status) {
      queryBuilder.andWhere('course.status = :status', { status: dto.status });
    }

    if (dto.accessType) {
      queryBuilder.andWhere('course.accessType = :accessType', { accessType: dto.accessType });
    }

    if (dto.keyword) {
      queryBuilder.andWhere('course.name LIKE :keyword OR course.description LIKE :keyword', {
        keyword: `%${dto.keyword}%`
      });
    }

    const [result, total] = await queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async findByUser(dto: CoursePaginationDto, accountId?: string) {
    const queryBuilder = this.buildUserCourseQuery(dto);
    const [result, total] = await queryBuilder
      .orderBy('course.createdAt', 'DESC')
      .getManyAndCount();

    await this.setAccessPermissions(result, accountId);
    return { result, total };
  }

  private buildUserCourseQuery(dto: CoursePaginationDto) {
    const queryBuilder = this.repo.createQueryBuilder('course')
      .leftJoinAndSelect('course.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.language', 'language')
      .select([
        'course.id', 'course.name', 'course.description', 'course.imageUrl',
        'course.thumbnailUrl', 'course.price', 'course.discountPrice', 'course.accessType',
        'course.totalDuration', 'course.totalLectures', 'course.validityDays',
        'course.averageRating', 'course.totalRatings', 'course.tutorId',
        'course.authorMessage', 'course.startDate', 'course.endDate',
        'course.subjectId', 'course.languageId', 'course.createdAt',
        'subject.id', 'subject.name', 'language.id', 'language.name',
        'tutor.id', 'tutorDetail.tutorId', 'tutorDetail.name'
      ])
      .where('course.status = :status', { status: CourseStatus.APPROVED });

    this.applyFilters(queryBuilder, dto);
    return queryBuilder;
  }

  private applyFilters(queryBuilder: any, dto: CoursePaginationDto) {
    if (dto.accessType) {
      queryBuilder.andWhere('course.accessType = :accessType', { accessType: dto.accessType });
    }
    if (dto.subjectId) {
      queryBuilder.andWhere('course.subjectId = :subjectId', { subjectId: dto.subjectId });
    }
    if (dto.languageId) {
      queryBuilder.andWhere('course.languageId = :languageId', { languageId: dto.languageId });
    }
    if (dto.tutorId) {
      queryBuilder.andWhere('course.tutorId = :tutorId', { tutorId: dto.tutorId });
    }
    if (dto.keyword) {
      queryBuilder.andWhere('course.name LIKE :keyword OR course.description LIKE :keyword', {
        keyword: `%${dto.keyword}%`
      });
    }
  }

  private async setAccessPermissions(courses: any[], accountId?: string) {
    for (const course of courses) {
      course['hasAccess'] = await this.checkCourseAccess(course, accountId);
    }
  }

  private async checkCourseAccess(course: any, accountId?: string): Promise<boolean> {
    if (course.accessType === AccessTypes.FREE) {
      return true;
    }
    if (!accountId) {
      return false;
    }
    const purchase = await this.userPurchaseRepo.findOne({
      where: {
        accountId,
        courseId: course.id,
        purchaseType: PurchaseType.COURSE,
        paymentStatus: PaymentStatus.COMPLETED
      }
    });
    return purchase && (!purchase.expiresAt || new Date() <= purchase.expiresAt);
  }
 
  async findOne(id: string) {
    const result = await this.repo.createQueryBuilder('course')
      .leftJoinAndSelect('course.subject', 'subject')
      .leftJoinAndSelect('course.language', 'language')
      .leftJoinAndSelect('course.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .select([
        'course.id',
        'course.name',
        'course.description',
        'course.imageUrl',
        'course.thumbnailUrl',
        'course.price',
        'course.discountPrice',
        'course.accessType',
        'course.validityDays',
        'course.status',
        'course.totalDuration',
        'course.totalLectures',
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
        'tutor.id',
        'tutorDetail.tutorId',
        'tutorDetail.name',
        'tutorDetail.bio',
        'tutorDetail.profileImage'

      ])
      .where('course.id = :id', { id })
      .getOne();

    if (!result) {
      throw new NotFoundException('Course not found!');
    }

    return result;
  }

async image(img: string, result: Course) {
  if (result.imagepath) {
    const oldPath = join(__dirname, '..', '..', result.imagepath);
    try {
      await fs.unlink(oldPath);
    } catch (err) {
      console.warn(`Failed to delete old image: ${oldPath}`, err.message);
    }
  }

  result.imageUrl = process.env.WIZNOVY_CDN_LINK + img;
  result.imagepath = img;

  return this.repo.save(result);
}

async thumbnail(img: string, result: Course) {
  if (result.thumbnailpath) {
    const oldPath = join(__dirname, '..', '..', result.thumbnailpath);
    try {
      await fs.unlink(oldPath);
    } catch (err) {
      console.warn(`Failed to delete old thumbnail: ${oldPath}`, err.message);
    }
  }

  result.thumbnailUrl = process.env.WIZNOVY_CDN_LINK + img;
  result.thumbnailpath = img;

  return this.repo.save(result);
}

  async update(id: string, dto: UpdateCourseDto, currentUserId: string, files?: { image?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Course not found!');
    }

    const currentUser = await this.accountRepo.findOne({ where: { id: currentUserId } });
    
    if (currentUser.roles !== UserRole.ADMIN && currentUser.roles !== UserRole.STAFF) {
      if (result.tutorId !== currentUserId) {
        throw new ConflictException('Only course creator or admin can update this course');
      }
    }

    const courseObj: any = Object.assign(result, dto);
    
    if (files?.image?.[0]) {
      courseObj.imageUrl = process.env.WIZNOVY_CDN_LINK + files.image[0].path;
      courseObj.imagepath = files.image[0].path;
    }
    
    if (files?.thumbnail?.[0]) {
      courseObj.thumbnailUrl = process.env.WIZNOVY_CDN_LINK + files.thumbnail[0].path;
      courseObj.thumbnailpath = files.thumbnail[0].path;
    }

    return this.repo.save(courseObj);
  }

  async updateStatus(id: string, dto: CourseStatusDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Course not found!');
    }

    const oldStatus = result.status;
    result.status = dto.status;
    const updatedCourse = await this.repo.save(result);

  
    if (oldStatus !== dto.status) {
      await this.notifyTutorStatusChange(result.tutorId, result.name, dto.status);
    }

    return updatedCourse;
  }

  async remove(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Course not found!');
    }
    result.status = CourseStatus.DELETED;
    return this.repo.save(result);
  }

  async deleteCourse(id: string, reason: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Course not found!');
    }
    result.status = CourseStatus.DELETED;
    result.deletionReason = reason;
    const updatedCourse = await this.repo.save(result);

    await this.notificationsService.create({
      title: 'Course Deleted',
      desc: `Your course "${result.name}" has been deleted. Reason: ${reason}`,
      type: NotificationType.USER_PRODUCT,
      accountId: result.tutorId
    });

    return updatedCourse;
  }

  private async notifyTutorStatusChange(tutorId: string, courseName: string, newStatus: CourseStatus) {
    const statusMessages = {
      [CourseStatus.APPROVED]: 'Your course has been approved and is now live!',
      [CourseStatus.REJECTED]: 'Your course has been rejected. Please review and resubmit.',
      [CourseStatus.DELETED]: 'Your course has been deleted by admin.',
      [CourseStatus.PENDING]: 'Your course is under review.'
    };

    await this.notificationsService.create({
      title: 'Course Status Update',
      desc: `${courseName}: ${statusMessages[newStatus]}`,
      type: NotificationType.USER_PRODUCT,
      accountId: tutorId
    });
  }

  async updateCourseStats(courseId: string) {
    const course = await this.repo.findOne({
      where: { id: courseId },
      relations: ['units', 'units.videoLectures']
    });
    
    if (!course) return;
    
    let totalLectures = 0;
    let totalDurationMinutes = 0;
    
    for (const unit of course.units) {
      totalLectures += unit.videoLectures.length;
      for (const lecture of unit.videoLectures) {
        if (lecture.duration) {
          totalDurationMinutes += Number(lecture.duration) || 0;
        }
      }
    }
    
    const totalDuration = `${totalDurationMinutes} min`;
    
    course.totalLectures = totalLectures;
    course.totalDuration = totalDuration;
    
    await this.repo.save(course);
  }

  private async notifyAllUsers(course: Course) {
    const users = await this.accountRepo.find({
      where: { 
        roles: UserRole.USER,
        status: DefaultStatus.ACTIVE 
      }
    });

    const notifications = users.map(user => ({
      title: 'New Course Available!',
      desc: `Check out our new course: ${course.name}`,
      type: NotificationType.USER_PRODUCT,
      accountId: user.id
    }));

    for (const notification of notifications) {
      await this.notificationsService.create(notification);
    }
  }

}