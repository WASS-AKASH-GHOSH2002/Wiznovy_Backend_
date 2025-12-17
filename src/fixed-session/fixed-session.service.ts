import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedSession } from './entities/fixed-session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFixedSessionDto, FixedSessionPaginationDto } from './dto/create-fixed-session.dto';
import { SessionStatus,  PaymentStatus, TimeSlot, NotificationType } from '../enum';

@Injectable()
export class FixedSessionService {
  constructor(
    @InjectRepository(FixedSession)
    private readonly sessionRepo: Repository<FixedSession>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    private readonly notificationsService: NotificationsService
  ) {}

  async createBooking(dto: CreateFixedSessionDto, userId: string) {
    const tutor = await this.tutorRepo.findOne({
      where: { accountId: dto.tutorId }
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const existingSession = await this.sessionRepo.findOne({
      where: {
        tutorId: tutor.accountId,
        sessionDate: new Date(dto.sessionDate),
        status: SessionStatus.SCHEDULED
      }
    });

    if (existingSession) {
      throw new ConflictException('Time slot already booked');
    }

    const userSessionCount = await this.sessionRepo.count({
      where: {
        userId,
        status: SessionStatus.SCHEDULED
      }
    });

    if (userSessionCount >= 3) {
      throw new ConflictException('You can only book maximum 3 fixed sessions at a time');
    }

    const sessionPrice = this.calculateFixedSessionPrice(tutor.hourlyRate, dto.duration);

    
    const session = this.sessionRepo.create({
      userId,
      tutorId: tutor.id,
      sessionDate: new Date(dto.sessionDate),
      timeSlot: dto.timeSlot,
      duration: dto.duration,
      amount: sessionPrice,
      notes: dto.notes,
      status: SessionStatus.PENDING
    });
    const savedSession = await this.sessionRepo.save(session);

    return {
      sessionId: savedSession.id,
      bookingDetails: {
        tutorName: tutor.name,
        sessionDate: dto.sessionDate,
        timeSlot: dto.timeSlot,
        timeRange: this.getTimeRange(dto.timeSlot),
        duration: dto.duration,
        amount: sessionPrice,
        notes: dto.notes
      }
    };
  }

  async getBookingDetails(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId, status: SessionStatus.PENDING },
      relations: ['tutor']
    });

    if (!session) {
      throw new NotFoundException('Booking not found or already processed');
    }

    const tutor = await this.tutorRepo.findOne({
      where: { accountId: session.tutorId }
    });

    return {
      sessionId: session.id,
      tutorName: tutor.name,
      sessionDate: session.sessionDate,
      timeSlot: session.timeSlot,
      timeRange: this.getTimeRange(session.timeSlot),
      duration: session.duration,
      amount: session.amount,
      notes: session.notes,
      status: session.status
    };
  }

  

  async confirmPayment(purchaseId: string, paymentIntentId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
      relations: ['session']
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    const session = await this.sessionRepo.findOne({
      where: { id: purchase.sessionId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    
    purchase.paymentStatus = PaymentStatus.COMPLETED;
    purchase.paymentIntentId = paymentIntentId;
    await this.purchaseRepo.save(purchase);

    
    session.status = SessionStatus.SCHEDULED;
    await this.sessionRepo.save(session);

    const tutor = await this.tutorRepo.findOne({
      where: { accountId: session.tutorId }
    });

    await this.sendNotifications(session, tutor);

    return {
      sessionId: session.id,
      status: 'CONFIRMED',
      message: 'Session booked successfully'
    };
  }

  async getUserSessionCount(userId: string) {
    const count = await this.sessionRepo.count({
      where: {
        userId,
        status: SessionStatus.SCHEDULED
      }
    });
    
    return {
      currentSessions: count,
      maxSessions: 3,
      canBook: count < 3
    };
  }

  async getAvailableSlots(tutorId: string, date: string) {
    const tutor = await this.tutorRepo.findOne({
      where: { accountId: tutorId }
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const bookedSlots = await this.sessionRepo.find({
      where: {
        tutorId: tutor.id,
        sessionDate: new Date(date),
        status: SessionStatus.SCHEDULED
      }
    });

    const allSlots = Object.values(TimeSlot).map(slot => ({
      timeSlot: slot,
      timeRange: this.getTimeRange(slot),
      durations: [25, 45].map(duration => ({
        duration,
        price: this.calculateFixedSessionPrice(tutor.hourlyRate, duration),
        available: !bookedSlots.some(booked => booked.timeSlot === slot)
      }))
    }));

    return {
      tutorId,
      date,
      slots: allSlots,
      sessionLimit: {
        maxSessions: 3,
        note: 'Users can book maximum 3 fixed sessions at a time'
      }
    };
  }

  async findUserSessions(userId: string, dto: FixedSessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .where('session.userId = :userId', { userId });

    if (dto.date) {
      queryBuilder.andWhere('session.sessionDate = :date', { date: dto.date });
    }

    if (dto.timeSlot) {
      queryBuilder.andWhere('session.timeSlot = :timeSlot', { timeSlot: dto.timeSlot });
    }

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findTutorSessions(tutorId: string, dto: FixedSessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .where('session.tutorId = :tutorId', { tutorId });

    if (dto.date) {
      queryBuilder.andWhere('session.sessionDate = :date', { date: dto.date });
    }

    if (dto.timeSlot) {
      queryBuilder.andWhere('session.timeSlot = :timeSlot', { timeSlot: dto.timeSlot });
    }

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  private calculateFixedSessionPrice(hourlyRate: number, durationMinutes: number): number {
    const hourlyFraction = durationMinutes / 60;
    return Math.round(hourlyRate * hourlyFraction * 100) / 100;
  }

  private getTimeRange(slot: TimeSlot): string {
    const ranges = {
      [TimeSlot.MORNING]: '06:00 - 12:00',
      [TimeSlot.AFTERNOON]: '12:00 - 17:00',
      [TimeSlot.EVENING]: '17:00 - 21:00',
      [TimeSlot.NIGHT]: '21:00 - 06:00'
    };
    return ranges[slot];
  }

  private async sendNotifications(session: FixedSession, tutor: TutorDetail) {
    const timeRange = this.getTimeRange(session.timeSlot);
    
    await this.notificationsService.create({
      title: 'New Session Booking',
      desc: `You have a new ${session.duration}min session booked for ${session.sessionDate} (${session.timeSlot}: ${timeRange})`,
      type: NotificationType.USER_ACCOUNT,
      accountId: tutor.accountId
    });
  }
}