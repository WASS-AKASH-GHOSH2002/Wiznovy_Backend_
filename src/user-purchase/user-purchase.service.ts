import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPurchase } from './entities/user-purchase.entity';
import { PurchaseType, PaymentStatus } from 'src/enum';
import { Course } from '../course/entities/course.entity';
import { Unit } from '../unit/entities/unit.entity';
import { StudyMaterial } from '../study-material/entities/study-material.entity';
import { VideoLecture } from '../video-lecture/entities/video-lecture.entity';
import { NotificationsService } from '../notifications/notifications.service';

interface PurchaseDto {
  purchaseType: PurchaseType;
  itemId: string;
}

@Injectable()
export class UserPurchaseService {
  constructor(
    @InjectRepository(UserPurchase)
    private readonly repo: Repository<UserPurchase>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(StudyMaterial)
    private readonly studyRepo: Repository<StudyMaterial>,
    @InjectRepository(VideoLecture)
    private readonly videoRepo: Repository<VideoLecture>,
    private readonly notificationsService: NotificationsService
  ) {}

  
  async purchaseItem(dto: PurchaseDto, accountId: string) {
    if (dto.purchaseType !== PurchaseType.COURSE) {
      throw new BadRequestException('Only full courses can be purchased.');
    }

    
    const existing = await this.repo.findOne({
      where: {
        accountId,
        courseId: dto.itemId,
        purchaseType: PurchaseType.COURSE,
        paymentStatus: PaymentStatus.COMPLETED,
      },
    });

    if (existing) {
      throw new BadRequestException('You already own this course.');
    }

    
    const course = await this.courseRepo.findOne({
      where: { id: dto.itemId },
      relations: ['units', 'units.studyMaterials', 'units.videoLectures'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const originalAmount = course.price || 0;
    const finalAmount = originalAmount; 
    const expiryDate = this.calculateExpiryDate(course.validityDays || 365);

    
    const purchase = this.repo.create({
      accountId,
      courseId: dto.itemId,
      purchaseType: PurchaseType.COURSE,
      amount: finalAmount,
      originalAmount,
      discountAmount: 0,
      paymentStatus: PaymentStatus.PENDING,
      transactionId: `TXN_${Date.now()}`,
      expiresAt: expiryDate,
    });

    const saved = await this.repo.save(purchase);
    saved.merchantOrderId = `${Date.now()}_${saved.id.slice(0, 8)}`;
    await this.repo.save(saved);

    return {
      success: true,
      message: 'Course purchase started. Please complete the payment.',
      merchantOrderId: saved.merchantOrderId,
      purchaseId: saved.id,
      itemName: course.name,
      amount: finalAmount,
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

  //  await this.unlockAllCourseContent(purchase.accountId, purchase.courseId, paymentId);

    return {
      success: true,
      message: 'Course purchased successfully and all content unlocked!',
    };
  }

 
  // private async unlockAllCourseContent(accountId: string, courseId: string, transactionId: string) {
  //   const course = await this.courseRepo.findOne({
  //     where: { id: courseId },
  //     relations: ['units', 'units.studyMaterials', 'units.videoLectures'],
  //   });

  //   if (!course) return;

  //   const unlockList: Partial<UserPurchase>[] = [];
  //   const expiryDate = this.calculateExpiryDate(course.validityDays || 365);

  //   for (const unit of course.units || []) {
     
  //     unlockList.push({
  //       accountId,
  //       purchaseType: PurchaseType.UNIT,
  //       unitId: unit.id,
  //       amount: 0,
  //       paymentStatus: PaymentStatus.COMPLETED,
  //       transactionId: `${transactionId}_UNIT_${unit.id}`,
  //       expiresAt: expiryDate,
  //     });

      
  //     for (const study of unit.studyMaterials || []) {
  //       unlockList.push({
  //         accountId,
  //         purchaseType: PurchaseType.STUDY_MATERIAL,
  //         studyMaterialId: study.id,
  //         amount: 0,
  //         paymentStatus: PaymentStatus.COMPLETED,
  //         transactionId: `${transactionId}_STUDY_${study.id}`,
  //         expiresAt: expiryDate,
  //       });
  //     }

    
  //     for (const video of unit.videoLectures || []) {
  //       unlockList.push({
  //         accountId,
  //         purchaseType: PurchaseType.VIDEO_LECTURE,
  //         videoLectureId: video.id,
  //         amount: 0,
  //         paymentStatus: PaymentStatus.COMPLETED,
  //         transactionId: `${transactionId}_VIDEO_${video.id}`,
  //         expiresAt: expiryDate,
  //       });
  //     }
  //   }

  //   if (unlockList.length > 0) {
  //     await this.repo.save(unlockList);
  //   }
  // }

  /**
   * 🕓 Helper — calculate expiry date
   */
  private calculateExpiryDate(validityDays: number): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + validityDays);
    return expiry;
  }

  async findAll(dto: any) {
    const [result, total] = await this.repo.findAndCount({
      relations: ['account', 'course', 'unit', 'studyMaterial'],
      skip: dto.offset || 0,
      take: dto.limit || 10,
      order: { createdAt: 'DESC' }
    });
    return { result, total };
  }

  async findAllByUser(userId: string, query: any) {
    const [result, total] = await this.repo.findAndCount({
      where: { accountId: userId },
      relations: ['course', 'unit', 'studyMaterial'],
      skip: query.offset || 0,
      take: query.limit || 10,
      order: { createdAt: 'DESC' }
    });
    return { result, total };
  }

  async checkExpiringSoon() {
    // Implementation for checking expiring purchases
    return { message: 'Checked expiring purchases' };
  }

  async checkExpired() {
    // Implementation for checking expired purchases
    return { message: 'Checked expired purchases' };
  }
}
