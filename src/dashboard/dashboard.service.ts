import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Book } from 'src/book/entities/book.entity';
import { Course } from 'src/course/entities/course.entity';
import { TutorPayout } from 'src/tutor-payout/entities/tutor-payout.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { BookStatus, CourseStatus, DefaultStatus, PaymentStatus, PayoutStatus, UserRole } from 'src/enum';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Account) private readonly accRepo: Repository<Account>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(TutorPayout) private readonly payoutRepo: Repository<TutorPayout>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getCounts() {
    const [
      totalUsers, activeUsers, inactiveUsers,
      totalStaff, activeStaff, inactiveStaff,
      totalTutors, activeTutors, inactiveTutors,
      totalCourses,
      totalBooks,
      totalAllUsers,
      totalPendingPayouts,
      pendingCourses,
      pendingBooks,
      pendingTutors,
      revenueResult,
    ] = await Promise.all([
      this.accRepo.count({ where: { roles: UserRole.USER } }),
      this.accRepo.count({ where: { roles: UserRole.USER, status: DefaultStatus.ACTIVE } }),
      this.accRepo.count({ where: { roles: UserRole.USER, status: DefaultStatus.DEACTIVE } }),

      this.accRepo.count({ where: { roles: UserRole.STAFF } }),
      this.accRepo.count({ where: { roles: UserRole.STAFF, status: DefaultStatus.ACTIVE } }),
      this.accRepo.count({ where: { roles: UserRole.STAFF, status: DefaultStatus.DEACTIVE } }),

      this.accRepo.count({ where: { roles: UserRole.TUTOR } }),
      this.accRepo.count({ where: { roles: UserRole.TUTOR, status: DefaultStatus.ACTIVE } }),
      this.accRepo.count({ where: { roles: UserRole.TUTOR, status: DefaultStatus.DEACTIVE } }),

      this.courseRepo.count({ where: { status: CourseStatus.APPROVED } }),
      this.bookRepo.count({ where: { status: BookStatus.APPROVED } }),
      this.accRepo.count({ where: [{ roles: UserRole.USER }, { roles: UserRole.TUTOR }, { roles: UserRole.STAFF }] }),

      this.payoutRepo.count({ where: { status: PayoutStatus.PENDING } }),
      this.courseRepo.count({ where: { status: CourseStatus.PENDING } }),
      this.bookRepo.count({ where: { status: BookStatus.PENDING } }),
      this.accRepo.count({ where: { roles: UserRole.TUTOR, status: DefaultStatus.PENDING } }),

      this.paymentRepo.createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('MONTH(payment.paidAt) = MONTH(CURDATE())')
        .andWhere('YEAR(payment.paidAt) = YEAR(CURDATE())')
        .getRawOne(),
    ]);

    return {
      totalAllUsers,
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      staff: { total: totalStaff, active: activeStaff, inactive: inactiveStaff },
      tutors: { total: totalTutors, active: activeTutors, inactive: inactiveTutors },
      totalCourses,
      totalBooks,
      totalPendingPayouts,
      revenueThisMonth: Number(revenueResult?.total || 0),
      pendingApprovals: {
        total: pendingTutors + pendingCourses + pendingBooks,
        tutors: pendingTutors,
        courses: pendingCourses,
        books: pendingBooks,
      },
    };
  }
}
