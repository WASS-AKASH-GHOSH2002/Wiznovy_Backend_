import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { CreateSessionDto, SessionPaginationDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { AdminCancelSessionDto } from './dto/admin-cancel-session.dto';
import { RescheduleSessionDto } from './dto/reschedule-session.dto';
import { SessionStatus, PurchaseType, PaymentStatus, SessionType, AdminActionType, AdminActionTargetType } from '../enum';
import { NotificationsService } from '../notifications/notifications.service';
import { TutorAvailabilityService } from '../tutor-availability/tutor-availability.service';
import { NodeMailerService } from '../node-mailer/node-mailer.service';
import { ZoomService } from '../zoom/zoom.service';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';
import { SlotLockService } from '../slot-lock/slot-lock.service';
import { OrderNumberGenerator } from '../utils/order-number.util';


@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly slotLockService: SlotLockService,
    private readonly notificationsService: NotificationsService,
    private readonly tutorAvailabilityService: TutorAvailabilityService,
    private readonly nodeMailerService: NodeMailerService,
    private readonly zoomService: ZoomService,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  async create(dto: CreateSessionDto, userId: string) {
    
    const lockAcquired = await this.slotLockService.acquireSlotLock(
      dto.tutorId, dto.sessionDate, dto.startTime, userId
    );
    
    if (!lockAcquired) {
      throw new ConflictException('This time slot is currently being booked by another user');
    }

    try {
      const tutor = await this.tutorRepo.findOne({
        where: { accountId: dto.tutorId }
      });

      if (!tutor) {
        throw new NotFoundException('Tutor not found');
      }

      let finalEndTime = dto.endTime;
      
      if (dto.sessionType === SessionType.TRIAL && dto.trialDuration) {
        const startTimeParts = dto.startTime.split(':');
        const startHour = Number.parseInt(startTimeParts[0]);
        const startMinute = Number.parseInt(startTimeParts[1]);
        
        const endMinute = startMinute + dto.trialDuration;
        const endHour = startHour + Math.floor(endMinute / 60);
        const finalMinute = endMinute % 60;
        
        finalEndTime = `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
      }
      
      const savedSession = await this.sessionRepo.manager.transaction(async manager => {
        const overlappingSessions = await manager.createQueryBuilder(Session, 'session')
          .where('session.tutorId = :tutorId', { tutorId: dto.tutorId })
          .andWhere('DATE(session.sessionDate) = DATE(:sessionDate)', { sessionDate: dto.sessionDate })
          .andWhere('session.status IN (:...statuses)', { statuses: [ SessionStatus.SCHEDULED] })
          .andWhere(
            '(session.startTime < :endTime AND session.endTime > :startTime)',
            { startTime: dto.startTime, endTime: finalEndTime }
          )
          .getMany();

        if (overlappingSessions.length > 0) {
          throw new ConflictException('Time slot conflicts with existing booking');
        }

        const duration = this.calculateDuration(dto.startTime, finalEndTime);
        const sessionPrice = this.calculateSessionPrice(tutor.hourlyRate, duration, dto.sessionType);

        const session = manager.create(Session, {
          userId,
          tutorId: dto.tutorId,
          sessionDate: new Date(dto.sessionDate),
          startTime: dto.startTime,
          endTime: finalEndTime,
          duration,
          amount: sessionPrice,
          notes: dto.notes,
          sessionType: dto.sessionType,
          status: SessionStatus.SCHEDULED
        });
        const savedSession = await manager.save(session);

        const purchase = manager.create(UserPurchase, {
          accountId: userId,
          sessionId: savedSession.id,
          purchaseType: PurchaseType.SESSION,
          amount: sessionPrice,
          originalAmount: sessionPrice,
          orderNumber: OrderNumberGenerator.generateOrderNumber(),
          paymentStatus: PaymentStatus.COMPLETED,
          transactionId: `TEST_${Date.now()}`,
          paidAt: new Date()
        });
        const savedPurchase = await manager.save(purchase);

        savedSession.purchaseId = savedPurchase.id;
        await manager.save(savedSession);

        return savedSession;
      });


      // Create Zoom meeting AFTER transaction completes
      let zoomMeeting = null;
      try {
        console.log('SESSION SERVICE - Creating Zoom meeting for session:', savedSession.id);
        zoomMeeting = await this.zoomService.createMeetingForSession({
          id: savedSession.id,
          sessionDate: new Date(dto.sessionDate),
          startTime: dto.startTime,
          duration: savedSession.duration,
          tutor: { tutorDetail: [{ name: tutor.name }] }
        } as any);
        console.log('SESSION SERVICE - Zoom meeting created:', zoomMeeting);
      } catch (error) {
        this.logger.error('Failed to create Zoom meeting:', error);
      }

      const zoomDetails = {
        joinUrl: zoomMeeting?.joinUrl,
        startUrl: zoomMeeting?.startUrl,
        meetingId: zoomMeeting?.meetingId,
        passcode: zoomMeeting?.password
      };

      const user = await this.accountRepo.findOne({
        where: { id: userId },
        relations: ['userDetail']
      });

      const tutorAccount = await this.accountRepo.findOne({
        where: { id: dto.tutorId },
        relations: ['tutorDetail']
      });

      const userName = user?.userDetail?.[0]?.name || 'Student';
      const tutorName = tutorAccount?.tutorDetail?.[0]?.name || 'Tutor';

      await this.notificationsService.create({
        title: 'Session Booked Successfully',
        desc: `Your session on ${dto.sessionDate} at ${dto.startTime} has been confirmed`,
        type: 'SESSION_BOOKED',
        accountId: userId
      });

      await this.notificationsService.create({
        title: 'New Session Booked',
        desc: `You have a new session on ${dto.sessionDate} at ${dto.startTime}`,
        type: 'SESSION_BOOKED',
        accountId: dto.tutorId
      });

      if (zoomMeeting) {
        await this.notificationsService.create({
          title: 'Zoom Meeting Ready',
          desc: `Your session is confirmed! Meeting ID: ${zoomMeeting.meetingId}. Join 5 minutes early.`,
          type: 'ZOOM_MEETING',
          accountId: userId
        });

        await this.notificationsService.create({
          title: 'Zoom Meeting Ready',
          desc: `Session with ${userName} confirmed! Meeting ID: ${zoomMeeting.meetingId}. Start 10 minutes early.`,
          type: 'ZOOM_MEETING',
          accountId: dto.tutorId
        });
      }

      if (user?.email) {
        await this.nodeMailerService.sendUserSessionConfirmation(
          user.email,
          userName,
          tutorName,
          dto.sessionDate,
          dto.startTime,
          finalEndTime,
          {
            joinUrl: zoomDetails.joinUrl,
            meetingId: zoomDetails.meetingId,
            passcode: zoomDetails.passcode
          }
        );
      }

      if (tutorAccount?.email) {
        await this.nodeMailerService.sendTutorSessionConfirmation(
          tutorAccount.email,
          tutorName,
          userName,
          dto.sessionDate,
          dto.startTime,
          finalEndTime,
          {
            startUrl: zoomDetails.startUrl,
            meetingId: zoomDetails.meetingId,
            passcode: zoomDetails.passcode
          }
        );
      }

      return {
        ...savedSession,
        message: 'Session created and confirmed for testing.',
      };
    } catch (error) {
      await this.slotLockService.releaseSlotLock(dto.tutorId, dto.sessionDate, dto.startTime);
      this.logger.error(`Session creation failed for user ${userId}:`, error);
      throw error;
    } finally {
      await this.slotLockService.releaseSlotLock(dto.tutorId, dto.sessionDate, dto.startTime);
    }
  }

  async findUserSessions(userId: string, dto: SessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
     .leftJoin('session.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('session.zoomMeeting', 'zoomMeeting')
      .select([
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'session.endTime',
        'session.duration',
        'session.amount',
        'session.status',
        'session.sessionType',
        'session.notes',
        'session.createdAt',
        'session.updatedAt',
        'tutor.id',
        'tutorDetail.name',
        'tutorDetail.bio',
        'tutorDetail.profileImage',
        'zoomMeeting.id',
        'zoomMeeting.meetingId',
        'zoomMeeting.joinUrl',
        'zoomMeeting.startTime',
        'zoomMeeting.password',
        'zoomMeeting.duration',
      ])
      .where('session.userId = :userId', { userId });

    if (dto.date) {
      queryBuilder.andWhere('DATE(session.sessionDate) = :date', { date: dto.date });
    }

    if (dto.fromDate) {
      queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: dto.fromDate });
    }

    if (dto.toDate) {
      queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: dto.toDate });
    }

    if (dto.status) {
      queryBuilder.andWhere('session.status = :status', { status: dto.status });
    } else {
      queryBuilder.andWhere(
        'session.status IN (:...statuses)',
        { statuses: [SessionStatus.PENDING, SessionStatus.SCHEDULED] }
      );
    }

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'ASC')
      .addOrderBy('session.startTime', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findSessionById(sessionId: string, userId: string) {
    const session = await this.sessionRepo.createQueryBuilder('session')
      .leftJoin('session.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('session.user', 'user')
      .leftJoin('user.userDetail', 'userDetail')
      .leftJoin('session.zoomMeeting', 'zoomMeeting')
      .select([
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'session.endTime',
        'session.duration',
        'session.amount',
        'session.status',
        'session.sessionType',
        'session.notes',
        'session.userId',
        'session.tutorId',
        'tutor.id',
        'tutorDetail.name',
        'tutorDetail.profileImage',
        'user.id',
        'userDetail.name',
        'zoomMeeting.meetingId',
        'zoomMeeting.joinUrl',
        'zoomMeeting.startUrl',
        'zoomMeeting.password'
      ])
      .where('session.id = :sessionId', { sessionId })
      .getOne();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId && session.tutorId !== userId) {
      throw new ForbiddenException('You can only view your own sessions');
    }

    return session;
  }

  async findTutorSessions(tutorId: string, dto: SessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.zoomMeeting', 'zoomMeeting')

      .select([
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'session.endTime',
        'session.duration',
        'session.amount',
        'session.status',
        'session.sessionType',
        'session.notes',
        'session.createdAt',
        'session.updatedAt',

        'user.id',
        'userDetail.name',
       

        'zoomMeeting.meetingId',
       // 'zoomMeeting.joinUrl',
        'zoomMeeting.startUrl',
       
        'zoomMeeting.startTime',
        'zoomMeeting.password'
      ])
      .where('session.tutorId = :tutorId', { tutorId });

    if (dto.date) {
      queryBuilder.andWhere('session.sessionDate = :date', { date: dto.date });
    }

    if (dto.fromDate) {
      queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: dto.fromDate });
    }

    if (dto.toDate) {
      queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: dto.toDate });
    }

    if (dto.status) {
      queryBuilder.andWhere('session.status = :status', { status: dto.status });
    }

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'ASC')
      .addOrderBy('session.startTime', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }



  private calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  async getPaymentHistory(userId: string, dto: any) {
    const queryBuilder = this.purchaseRepo.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.session', 'session')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .where('purchase.accountId = :userId', { userId })
      .andWhere('purchase.purchaseType = :type', { type: PurchaseType.SESSION });

    if (dto.paymentStatus) {
      queryBuilder.andWhere('purchase.paymentStatus = :status', { status: dto.paymentStatus });
    }

    const [result, total] = await queryBuilder
      .orderBy('purchase.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 20)
      .getManyAndCount();

    return { result, total };
  }

  async cancelSession(dto: CancelSessionDto, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['user', 'tutor']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ConflictException('You can only cancel your own sessions');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled sessions can be cancelled');
    }

    const sessionDateTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 2) {
      throw new BadRequestException('Sessions cannot be cancelled less than 2 hours before start time');
    }

    session.status = SessionStatus.CANCELLED;
    session.cancelledAt = new Date();
    session.cancelledBy = userId;
    await this.sessionRepo.save(session);
    let refundProcessed = false;
    if (session.purchaseId) {
      const purchase = await this.purchaseRepo.findOne({ where: { id: session.purchaseId } });
      if (purchase && purchase.paymentStatus === PaymentStatus.COMPLETED) {
        const refundEligible = hoursUntilSession >= 24;
        if (refundEligible) {
          purchase.paymentStatus = PaymentStatus.REFUNDED;
          await this.purchaseRepo.save(purchase);
          refundProcessed = true;
        }
      }
    }

    const user = await this.accountRepo.findOne({
      where: { id: session.userId },
      relations: ['userDetail']
    });

    const tutorAccount = await this.accountRepo.findOne({
      where: { id: session.tutorId },
      relations: ['tutorDetail']
    });

    if (user?.email) {
      await this.nodeMailerService.sendSessionCancellationEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorAccount?.tutorDetail?.[0]?.name || 'Tutor',
        {
          date: typeof session.sessionDate === 'string' ? session.sessionDate : session.sessionDate.toISOString().split('T')[0],
          startTime: session.startTime,
          endTime: session.endTime
        },
        'student',
        hoursUntilSession >= 24
      );
    }

    await this.notificationsService.create({
      title: 'Session Cancelled',
      desc: `Your session on ${session.sessionDate} at ${session.startTime} has been cancelled`,
      type: 'SESSION_CANCELLED',
      accountId: session.userId
    });

    await this.notificationsService.create({
      title: 'Session Cancelled by Student',
      desc: `Session on ${session.sessionDate} at ${session.startTime} was cancelled by the student`,
      type: 'SESSION_CANCELLED',
      accountId: session.tutorId
    });

    return {
      message: 'Session cancelled successfully. The time slot is now available for other users to book.',
      refundEligible: hoursUntilSession >= 24,
      refundProcessed,
      slotReleased: true,
      session: {
        ...session,
        user: {
          id: user?.id,
          name: user?.userDetail?.[0]?.name,
          email: user?.email
        },
        tutor: {
          id: tutorAccount?.id,
          name: tutorAccount?.tutorDetail?.[0]?.name,
          email: tutorAccount?.email
        }
      }
    };
  }

  async getUpcomingSessions(userId: string) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .where('session.userId = :userId', { userId })
      .andWhere('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('session.sessionDate >= :today', { today })
      .orderBy('session.sessionDate', 'ASC')
      .addOrderBy('session.startTime', 'ASC')
      .getMany();
  }

  
  async verifySlotAvailability(tutorId: string, sessionDate: string, startTime: string, endTime: string) {
    const conflictingSessions = await this.sessionRepo.createQueryBuilder('session')
      .where('session.tutorId = :tutorId', { tutorId })
      .andWhere('DATE(session.sessionDate) = :date', { date: sessionDate })
      .andWhere('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('session.startTime < :endTime AND session.endTime > :startTime', {
        startTime,
        endTime
      })
      .getCount();

    return conflictingSessions === 0;
  }

  async getCancellationPolicy(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      return {
        canCancel: false,
        reason: 'Only scheduled sessions can be cancelled'
      };
    }

    const sessionDateTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 2) {
      return {
        canCancel: false,
        reason: 'Sessions cannot be cancelled less than 2 hours before start time'
      };
    }

    const refundEligible = hoursUntilSession >= 24;
    
    return {
      canCancel: true,
      refundEligible,
      hoursUntilSession: Math.floor(hoursUntilSession),
      policy: {
        minimumCancellationTime: '2 hours before session',
        fullRefundTime: '24 hours before session',
        noRefundTime: 'Less than 24 hours before session'
      }
    };
  }

  async rescheduleSession(dto: RescheduleSessionDto, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['user', 'tutor']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ConflictException('You can only reschedule your own sessions');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled sessions can be rescheduled');
    }

 
    const availableSlots = await this.tutorAvailabilityService.getAvailableBookingSlots(
      session.tutorId, 
      dto.newSessionDate
    );

    const isSlotAvailable = availableSlots.slots.some(slot => 
      slot.start === dto.newStartTime && slot.end === dto.newEndTime
    );

    if (!isSlotAvailable) {
      throw new ConflictException('Selected time slot is not available in tutor\'s schedule');
    }

    const oldDate = session.sessionDate;
    const oldStartTime = session.startTime;
    const oldEndTime = session.endTime;

    session.sessionDate = new Date(dto.newSessionDate);
    session.startTime = dto.newStartTime;
    session.endTime = dto.newEndTime;
    session.duration = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    
    await this.sessionRepo.save(session);

    const user = await this.accountRepo.findOne({
      where: { id: session.userId },
      relations: ['userDetail']
    });

    const tutorAccount = await this.accountRepo.findOne({
      where: { id: session.tutorId },
      relations: ['tutorDetail']
    });

    if (user?.email) {
      await this.nodeMailerService.sendSessionRescheduleEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorAccount?.tutorDetail?.[0]?.name || 'Tutor',
        {
          date: typeof oldDate === 'string' ? oldDate : oldDate.toISOString().split('T')[0],
          startTime: oldStartTime,
          endTime: oldEndTime
        },
        {
          date: dto.newSessionDate,
          startTime: dto.newStartTime,
          endTime: dto.newEndTime
        },
        'student'
      );
    }

    await this.notificationsService.create({
      title: 'Session Rescheduled',
      desc: `Your session has been rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`,
      type: 'SESSION_RESCHEDULED',
      accountId: session.userId
    });

    await this.notificationsService.create({
      title: 'Session Rescheduled by Student',
      desc: `Session rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`,
      type: 'SESSION_RESCHEDULED',
      accountId: session.tutorId
    });

    return {
      message: 'Session rescheduled successfully',
      session: {
        ...session,
        user: {
          id: user?.id,
          name: user?.userDetail?.[0]?.name,
          email: user?.email
        },
        tutor: {
          id: tutorAccount?.id,
          name: tutorAccount?.tutorDetail?.[0]?.name,
          email: tutorAccount?.email
        }
      },
      oldSchedule: { date: oldDate, startTime: oldStartTime, endTime: oldEndTime },
      newSchedule: { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime }
    };
  }

  async getReschedulePolicy(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      return {
        canReschedule: false,
        reason: 'Only scheduled sessions can be rescheduled'
      };
    }

    const sessionDateTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 4) {
      return {
        canReschedule: false,
        reason: 'Sessions cannot be rescheduled less than 4 hours before start time'
      };
    }

    return {
      canReschedule: true,
      hoursUntilSession: Math.floor(hoursUntilSession),
      policy: {
        minimumRescheduleTime: '4 hours before session',
        tutorId: session.tutorId
      }
    };
  }



  async getRescheduleSummary(dto: RescheduleSessionDto, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['tutor', 'tutor.tutorDetail']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ConflictException('You can only reschedule your own sessions');
    }

   
    const availableSlots = await this.tutorAvailabilityService.getAvailableBookingSlots(
      session.tutorId, 
      dto.newSessionDate
    );

    const isSlotAvailable = availableSlots.slots.some(slot => 
      slot.start === dto.newStartTime && slot.end === dto.newEndTime
    );

    if (!isSlotAvailable) {
      throw new ConflictException('Selected time slot is not available in tutor\'s schedule');
    }

    const newDuration = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    
    return {
      session: {
        id: session.id,
        tutorName: session.tutor?.tutorDetail?.[0]?.name || 'Unknown',
        currentSchedule: {
          date: session.sessionDate,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration
        },
        newSchedule: {
          date: dto.newSessionDate,
          startTime: dto.newStartTime,
          endTime: dto.newEndTime,
          duration: newDuration
        }
      },
      slotAvailable: true,
      message: 'Ready to reschedule. Please confirm to proceed.'
    };
  }

  async getAvailableSlots(tutorId: string, date: string) {
    return await this.tutorAvailabilityService.getAvailableBookingSlots(tutorId, date);
  }

  // @Cron('0 */30 * * * *') 
  // async handleSessionReminders() {
  //   this.logger.log('Running automatic session reminders cron job');
  //   try {
  //     const result = await this.sendSessionReminders();
  //     this.logger.log(`Session reminders completed: ${result.remindersSent24h} (24h) + ${result.remindersSent1h} (1h) reminders sent`);
  //   } catch (error) {
  //     this.logger.error('Error in session reminders cron job:', error);
  //   }
  // }

  async sendSessionReminders() {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const sessions24h = await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .where('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('CONCAT(session.sessionDate, " ", session.startTime) BETWEEN :now AND :twentyFourHours', {
        now: now.toISOString().slice(0, 19).replace('T', ' '),
        twentyFourHours: twentyFourHoursLater.toISOString().slice(0, 19).replace('T', ' ')
      })
      .getMany();

    const sessions1h = await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .where('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('CONCAT(session.sessionDate, " ", session.startTime) BETWEEN :now AND :oneHour', {
        now: now.toISOString().slice(0, 19).replace('T', ' '),
        oneHour: oneHourLater.toISOString().slice(0, 19).replace('T', ' ')
      })
      .getMany();

    for (const session of sessions24h) {
      if (session.user?.email) {
        const sessionDateStr = session.sessionDate instanceof Date 
          ? session.sessionDate.toISOString().split('T')[0]
          : String(session.sessionDate).split('T')[0];
          
        await this.nodeMailerService.sendSessionReminder(
          session.user.email,
          session.user.userDetail?.[0]?.name || 'Student',
          session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
          sessionDateStr,
          session.startTime,
          session.endTime,
          24
        );
        
        await this.notificationsService.notifySessionReminder(
          session.userId,
          session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
          sessionDateStr,
          session.startTime,
          24
        );
      }
    }

    for (const session of sessions1h) {
      if (session.user?.email) {
        const sessionDateStr = session.sessionDate instanceof Date 
          ? session.sessionDate.toISOString().split('T')[0]
          : String(session.sessionDate).split('T')[0];
          
        await this.nodeMailerService.sendSessionReminder(
          session.user.email,
          session.user.userDetail?.[0]?.name || 'Student',
          session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
          sessionDateStr,
          session.startTime,
          session.endTime,
          1
        );
        
        await this.notificationsService.notifySessionReminder(
          session.userId,
          session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
          sessionDateStr,
          session.startTime,
          1
        );
      }
    }

    return {
      message: 'Session reminders sent',
      remindersSent24h: sessions24h.length,
      remindersSent1h: sessions1h.length
    };
  }

  private calculateSessionPrice(hourlyRate: number, durationMinutes: number, sessionType: SessionType): number {
    const hourlyFraction = durationMinutes / 60;
    return Math.round(hourlyRate * hourlyFraction * 100) / 100;
  }

  async confirmPayment(sessionId: string, userId: string, paymentData: any) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
      relations: ['user', 'user.userDetail', 'tutor', 'tutor.tutorDetail']
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.status !== SessionStatus.PENDING) {
      throw new BadRequestException('Session is not in pending status');
    }

    const sessionDateStr = session.sessionDate instanceof Date 
      ? session.sessionDate.toISOString().split('T')[0]
      : String(session.sessionDate).split('T')[0];
    const hasLock = await this.slotLockService.verifyUserLock(
      session.tutorId, sessionDateStr, session.startTime, userId
    );
    
    if (!hasLock) {
      throw new ConflictException('Session lock has expired. Please try booking again.');
    }

    // Update session and create purchase record
    await this.sessionRepo.manager.transaction(async manager => {
      // Create UserPurchase record when payment is successful
      const purchase = manager.create(UserPurchase, {
        accountId: userId,
        sessionId: session.id,
        purchaseType: PurchaseType.SESSION,
        amount: session.amount,
        originalAmount: session.amount,
        orderNumber: OrderNumberGenerator.generateOrderNumber(),
        paymentStatus: PaymentStatus.COMPLETED,
        transactionId: paymentData.paymentId || paymentData.transactionId,
        paidAt: new Date()
      });
      const savedPurchase = await manager.save(purchase);

      // Update session status and link to purchase
      session.status = SessionStatus.SCHEDULED;
      session.purchaseId = savedPurchase.id;
      await manager.save(session);
    });

    // Release Redis lock
    await this.slotLockService.releaseSlotLock(session.tutorId, sessionDateStr, session.startTime);

    // Create Zoom meeting
    try {
      const sessionDateTime = new Date(`${sessionDateStr}T${session.startTime}:00`);
      await this.zoomService.createMeetingForSession({
        id: session.id,
        sessionDate: new Date(sessionDateStr),
        startTime: session.startTime,
        duration: session.duration,
        tutor: { tutorDetail: [{ name: session.tutor?.tutorDetail?.[0]?.name }] }
      } as any);
    } catch (error) {
      this.logger.error('Failed to create Zoom meeting:', error);
    }

    // Send notifications
    await this.notificationsService.create({
      title: 'Session Booked Successfully',
      desc: `Your session on ${sessionDateStr} at ${session.startTime} has been confirmed`,
      type: 'SESSION_BOOKED',
      accountId: session.userId
    });

    await this.notificationsService.create({
      title: 'New Session Booked',
      desc: `You have a new session on ${sessionDateStr} at ${session.startTime}`,
      type: 'SESSION_BOOKED',
      accountId: session.tutorId
    });

    // Send confirmation emails
    if (session.user?.email) {
      await this.nodeMailerService.sendSessionBookingConfirmation(
        session.user.email,
        session.user.userDetail?.[0]?.name || 'Student',
        session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
        sessionDateStr,
        session.startTime,
        session.endTime
      );
    }

    if (session.tutor?.email) {
      await this.nodeMailerService.sendSessionBookingConfirmation(
        session.tutor.email,
        session.tutor.tutorDetail?.[0]?.name || 'Tutor',
        session.user?.userDetail?.[0]?.name || 'Student',
        sessionDateStr,
        session.startTime,
        session.endTime
      );
    }

    return {
      message: 'Payment confirmed. Session successfully booked.',
      session: {
        id: session.id,
        status: session.status,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime
      }
    };
  }

 

  async findAllSessions(dto: SessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
      .leftJoin('session.user', 'user')
      .leftJoin('user.userDetail', 'userDetail')
      .leftJoin('session.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('session.zoomMeeting', 'zoomMeeting')
      .select([
        'session',
        'user.id', 'user.email',
        'userDetail.name',
        'tutor.id', 'tutor.email',
        'tutorDetail.name', 'tutorDetail.profileImage',
        'zoomMeeting.meetingId', 'zoomMeeting.joinUrl', 'zoomMeeting.startUrl'
      ]);

    if (dto.date) {
      queryBuilder.andWhere('DATE(session.sessionDate) = :date', { date: dto.date });
    }

    if (dto.fromDate) {
      queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: dto.fromDate });
    }

    if (dto.toDate) {
      queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: dto.toDate });
    }

    if (dto.status) {
      queryBuilder.andWhere('session.status = :status', { status: dto.status });
    }

    if (dto.sessionType) {
      queryBuilder.andWhere('session.sessionType = :sessionType', { sessionType: dto.sessionType });
    }

   

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'DESC')
      .addOrderBy('session.startTime', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async adminFindOne(id: string) {
    const session = await this.sessionRepo.createQueryBuilder('session')
      .leftJoin('session.user', 'user')
      .leftJoin('user.userDetail', 'userDetail')
      .leftJoin('session.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('session.zoomMeeting', 'zoomMeeting')
      .select([
        'session',
        'user.id', 'user.email',
        'userDetail.name',
        'tutor.id', 'tutor.email',
        'tutorDetail.name', 'tutorDetail.profileImage',
        'zoomMeeting.meetingId', 'zoomMeeting.joinUrl', 'zoomMeeting.startUrl'
      ])
      .where('session.id = :id', { id })
      .getOne();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async adminRescheduleSession(sessionId: string, dto: RescheduleSessionDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user', 'user.userDetail', 'tutor', 'tutor.tutorDetail']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const oldDate = session.sessionDate;
    const oldStartTime = session.startTime;
    const oldEndTime = session.endTime;

    session.sessionDate = new Date(dto.newSessionDate);
    session.startTime = dto.newStartTime;
    session.endTime = dto.newEndTime;
    session.duration = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    
    await this.sessionRepo.save(session);

    await this.notificationsService.create({
      title: 'Session Rescheduled by Admin',
      desc: `Your session has been rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`,
      type: 'SESSION_RESCHEDULED',
      accountId: session.userId
    });

    await this.notificationsService.create({
      title: 'Session Rescheduled by Admin',
      desc: `Session rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`,
      type: 'SESSION_RESCHEDULED',
      accountId: session.tutorId
    });

    return {
      message: 'Session rescheduled successfully by admin',
      session,
      oldSchedule: { date: oldDate, startTime: oldStartTime, endTime: oldEndTime },
      newSchedule: { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime }
    };
  }

  async adminCancelSession(sessionId: string, dto: AdminCancelSessionDto, adminId: string, ipAddress?: string, userAgent?: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user', 'tutor']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled sessions can be cancelled');
    }

    session.status = SessionStatus.CANCELLED;
    session.cancelledAt = new Date();
    session.cancelledBy = 'ADMIN';
    await this.sessionRepo.save(session);

    let refundProcessed = false;
    if (session.purchaseId) {
      const purchase = await this.purchaseRepo.findOne({ where: { id: session.purchaseId } });
      if (purchase && purchase.paymentStatus === PaymentStatus.COMPLETED) {
        purchase.paymentStatus = PaymentStatus.REFUNDED;
        await this.purchaseRepo.save(purchase);
        refundProcessed = true;
      }
    }

    const user = await this.accountRepo.findOne({
      where: { id: session.userId },
      relations: ['userDetail']
    });

    const tutorAccount = await this.accountRepo.findOne({
      where: { id: session.tutorId },
      relations: ['tutorDetail']
    });

    if (user?.email) {
      await this.nodeMailerService.sendSessionCancellationEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorAccount?.tutorDetail?.[0]?.name || 'Tutor',
        {
          date: typeof session.sessionDate === 'string' ? session.sessionDate : session.sessionDate.toISOString().split('T')[0],
          startTime: session.startTime,
          endTime: session.endTime
        },
        'admin',
        true
      );
    }

    if (tutorAccount?.email) {
      await this.nodeMailerService.sendSessionCancellationEmail(
        tutorAccount.email,
        tutorAccount.tutorDetail?.[0]?.name || 'Tutor',
        user?.userDetail?.[0]?.name || 'Student',
        {
          date: typeof session.sessionDate === 'string' ? session.sessionDate : session.sessionDate.toISOString().split('T')[0],
          startTime: session.startTime,
          endTime: session.endTime
        },
        'tutor',
        true
      );
    }

    await this.notificationsService.create({
      title: 'Session Cancelled by Admin',
      desc: `Your session on ${session.sessionDate} at ${session.startTime} has been cancelled by admin${dto.reason ? `: ${dto.reason}` : ''}`,
      type: 'SESSION_CANCELLED',
      accountId: session.userId
    });

    await this.notificationsService.create({
      title: 'Session Cancelled by Admin',
      desc: `Session on ${session.sessionDate} at ${session.startTime} was cancelled by admin${dto.reason ? `: ${dto.reason}` : ''}`,
      type: 'SESSION_CANCELLED',
      accountId: session.tutorId
    });

    await this.adminActionLogService.log(
      adminId,
      AdminActionType.SESSION_CANCELLED,
      sessionId,
      AdminActionTargetType.SESSION,
      `Admin cancelled session ${sessionId}${dto.reason ? ` - Reason: ${dto.reason}` : ''}`,
      ipAddress,
      userAgent,
    );

    return {
      message: 'Session cancelled successfully by admin. The time slot is now available for other users to book.',
      refundProcessed,
      slotReleased: true,
      session: {
        ...session,
        user: {
          id: user?.id,
          name: user?.userDetail?.[0]?.name,
          email: user?.email
        },
        tutor: {
          id: tutorAccount?.id,
          name: tutorAccount?.tutorDetail?.[0]?.name,
          email: tutorAccount?.email
        }
      }
    };
  }

  async adminCreateSession(dto: CreateSessionDto) {
    const tutor = await this.tutorRepo.findOne({
      where: { accountId: dto.tutorId }
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const user = await this.accountRepo.findOne({
      where: { id: dto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let finalEndTime = dto.endTime;
    
    if (dto.sessionType === SessionType.TRIAL && dto.trialDuration) {
      const startTimeParts = dto.startTime.split(':');
      const startHour = Number.parseInt(startTimeParts[0]);
      const startMinute = Number.parseInt(startTimeParts[1]);
      
      const endMinute = startMinute + dto.trialDuration;
      const endHour = startHour + Math.floor(endMinute / 60);
      const finalMinute = endMinute % 60;
      
      finalEndTime = `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
    }

    const duration = this.calculateDuration(dto.startTime, finalEndTime);
    const sessionPrice = this.calculateSessionPrice(tutor.hourlyRate, duration, dto.sessionType);

    const session = this.sessionRepo.create({
      userId: dto.userId,
      tutorId: dto.tutorId,
      sessionDate: new Date(dto.sessionDate),
      startTime: dto.startTime,
      endTime: finalEndTime,
      duration,
      amount: sessionPrice,
      notes: dto.notes || 'Manually created by admin for testing',
      sessionType: dto.sessionType,
      status: SessionStatus.SCHEDULED
    });
    
    const savedSession = await this.sessionRepo.save(session);

    await this.notificationsService.create({
      title: 'New Session Created',
      desc: `A session has been scheduled for ${dto.sessionDate} at ${dto.startTime}`,
      type: 'SESSION_BOOKED',
      accountId: dto.userId
    });

    await this.notificationsService.create({
      title: 'New Session Assigned',
      desc: `You have a new session on ${dto.sessionDate} at ${dto.startTime}`,
      type: 'SESSION_BOOKED',
      accountId: dto.tutorId
    });

    return {
      message: 'Session created successfully by admin',
      session: savedSession
    };
  }
}