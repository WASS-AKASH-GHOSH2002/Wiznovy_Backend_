import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPurchase } from './entities/user-purchase.entity';
import { PaymentStatus } from 'src/enum';
import { Course } from '../course/entities/course.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderNumberGenerator } from '../utils/order-number.util';

interface PurchaseDto {
  itemId: string;
}

@Injectable()
export class UserPurchaseService {
  constructor(
    @InjectRepository(UserPurchase)
    private readonly repo: Repository<UserPurchase>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly notificationsService: NotificationsService
  ) {}

  
  async purchaseItem(dto: PurchaseDto, accountId: string) {
    const existing = await this.repo.findOne({
      where: {
        accountId,
        courseId: dto.itemId,
        paymentStatus: PaymentStatus.COMPLETED,
      },
    });

    if (existing) {
      throw new BadRequestException('You already own this course.');
    }

    const course = await this.courseRepo.findOne({ where: { id: dto.itemId } });
    if (!course) throw new NotFoundException('Course not found');

    const originalAmount = course.price || 0;
    const expiryDate = this.calculateExpiryDate(course.validityDays || 365);

    const saved = await this.repo.save(this.repo.create({
      accountId,
      courseId: dto.itemId,
      amount: originalAmount,
      originalAmount,
      paymentStatus: PaymentStatus.PENDING,
      transactionId: `TXN_${Date.now()}`,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      expiresAt: expiryDate,
    }));

    return {
      success: true,
      message: 'Course purchase started. Please complete the payment.',
      purchaseId: saved.id,
      itemName: course.name,
      amount: originalAmount,
    };
  }

  
  async completePurchase(purchaseId: string, paymentId: string) {
    const purchase = await this.repo.findOne({
      where: { id: purchaseId },
      relations: ['course'],
    });

    if (!purchase) throw new NotFoundException('Purchase not found');

    purchase.paymentStatus = PaymentStatus.COMPLETED;
    purchase.transactionId = paymentId;
    await this.repo.save(purchase);

    await this.notificationsService.notifyPaymentSuccess(
      purchase.accountId,
      purchase.course?.name || 'Course',
      purchase.amount
    );



    return {
      success: true,
      message: 'Course purchased successfully and all content unlocked!',
    };
  }



  /**
   * 🕓 Helper — calculate expiry date
   */
  private calculateExpiryDate(validityDays: number): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + validityDays);
    return expiry;
  }

  async getMyEnrolledCourses(accountId: string, query: any) {
    const now = new Date();

    const queryBuilder = this.repo.createQueryBuilder('purchase')
      .leftJoin('purchase.course', 'course')
      .leftJoin('course.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('course.subject', 'subject')
      .leftJoin('course.language', 'language')
      .select([
        'purchase.id',
        'purchase.courseId',
        'purchase.amount',
        'purchase.paymentStatus',
        'purchase.paidAt',
        'purchase.expiresAt',
        'purchase.createdAt',
        'course.id',
        'course.name',
        'course.description',
        'course.thumbnailUrl',
        'course.totalDuration',
        'course.totalLectures',
        'course.averageRating',
        'course.validityDays',
        'course.accessType',
        'subject.id',
        'subject.name',
        'language.id',
        'language.name',
        'tutor.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
      ])
      .where('purchase.accountId = :accountId', { accountId })
      .andWhere('purchase.paymentStatus = :status', { status: PaymentStatus.COMPLETED });

    if (query.isExpired === 'true') {
      queryBuilder.andWhere('purchase.expiresAt < :now', { now });
    } else if (query.isExpired === 'false') {
      queryBuilder.andWhere('(purchase.expiresAt IS NULL OR purchase.expiresAt >= :now)', { now });
    }

    const [result, total] = await queryBuilder
      .orderBy('purchase.createdAt', 'DESC')
      .skip(query.offset || 0)
      .take(query.limit || 10)
      .getManyAndCount();

    return {
      result: result.map(p => ({
        ...p,
        isExpired: p.expiresAt ? new Date() > p.expiresAt : false,
        daysRemaining: p.expiresAt
          ? Math.max(0, Math.ceil((p.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : null,
      })),
      total,
    };
  }

  async checkCourseEnrollment(accountId: string, courseId: string) {
    const now = new Date();
    const purchase = await this.repo.findOne({
      where: {
        accountId,
        courseId,
        paymentStatus: PaymentStatus.COMPLETED,
      },
    });

    if (!purchase) {
      return { enrolled: false, hasAccess: false };
    }

    const isExpired = purchase.expiresAt ? now > purchase.expiresAt : false;
    const daysRemaining = purchase.expiresAt
      ? Math.max(0, Math.ceil((purchase.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      enrolled: true,
      hasAccess: !isExpired,
      isExpired,
      expiresAt: purchase.expiresAt,
      daysRemaining,
      purchaseId: purchase.id,
      paidAt: purchase.paidAt,
    };
  }

  async findAll(dto: any) {
    const [result, total] = await this.repo.findAndCount({
      relations: ['account', 'course'],
      skip: dto.offset || 0,
      take: dto.limit || 10,
      order: { createdAt: 'DESC' }
    });
    return { result, total };
  }

  async findAllByUser(userId: string, query: any) {
    const [result, total] = await this.repo.findAndCount({
      where: { accountId: userId },
      relations: ['course'],
      skip: query.offset || 0,
      take: query.limit || 10,
      order: { createdAt: 'DESC' }
    });
    return { result, total };
  }

  async checkExpiringSoon() {

    return { message: 'Checked expiring purchases' };
  }

  async checkExpired() {
    // Implementation for checking expired purchases
    return { message: 'Checked expired purchases' };
  }
}
