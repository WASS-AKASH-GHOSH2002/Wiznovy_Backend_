import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { TutorDetail } from '../tutor-details/entities/tutor-detail.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CreateSessionDto, SessionPaginationDto, BookRegularSessionDto, BookTrialSessionDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { AdminCancelSessionDto } from './dto/admin-cancel-session.dto';
import { RescheduleSessionDto } from './dto/reschedule-session.dto';
import { SessionStatus, PurchaseType, PaymentStatus, SessionType, TransactionType, TransactionStatus, NotificationType } from '../enum';
import { buildCsv, CsvColumn, formatCsvDate, generateCsvFileName } from 'src/utils/csv.utils';
import { ExportStudentsCsvDto, DateRangePreset } from '../account/dto/export-students-csv.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { TutorAvailabilityService } from '../tutor-availability/tutor-availability.service';
import { NodeMailerService } from '../node-mailer/node-mailer.service';
import { ZoomService } from '../zoom/zoom.service';
import { AdminActionLogService } from '../admin-action-log/admin-action-log.service';
import { SlotLockService } from '../slot-lock/slot-lock.service';
import { SettingsService } from '../settings/settings.service';
import { WalletTransaction } from '../wallet-transaction/entities/wallet-transaction.entity';


import { CustomException } from '../shared/exceptions/custom.exception';
import { MessageType } from '../shared/constants/message-type.enum';
import { MESSAGE_CODES } from '../shared/constants/message-codes';
import { HttpStatus } from '@nestjs/common';


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
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
    private readonly slotLockService: SlotLockService,
    private readonly notificationsService: NotificationsService,
    private readonly tutorAvailabilityService: TutorAvailabilityService,
    private readonly nodeMailerService: NodeMailerService,
    private readonly zoomService: ZoomService,
    private readonly adminActionLogService: AdminActionLogService,
    private readonly settingsService: SettingsService,
  ) {}


  async bookRegularSession(dto: BookRegularSessionDto, userId: string) {
    const tutor = await this.validateTutor(dto.tutorId);
    const sessionSettings = await this.settingsService.getSessionSettings();
    const duration = Number(sessionSettings?.regular_session_duration_minutes) || 60;
    const finalEndTime = this.calculateEndTime(dto.startTime, duration);
    const amount = this.calculateSessionPrice(tutor.hourlyRate, duration, SessionType.REGULAR);

    return this.processBooking({
      tutorId: dto.tutorId,
      userId,
      sessionDate: dto.sessionDate,
      startTime: dto.startTime,
      endTime: finalEndTime,
      duration,
      amount,
      notes: dto.notes,
      sessionType: SessionType.REGULAR,
    });
  }

  async bookTrialSession(dto: BookTrialSessionDto, userId: string) {
    const tutor = await this.validateTutor(dto.tutorId);
    await this.validateNoExistingTrial(userId, dto.tutorId);
    const sessionSettings = await this.settingsService.getSessionSettings();
    const duration = Number(sessionSettings?.trial_duration_minutes) || 25;
    const finalEndTime = this.calculateEndTime(dto.startTime, duration);

    return this.processBooking({
      tutorId: dto.tutorId,
      userId,
      sessionDate: dto.sessionDate,
      startTime: dto.startTime,
      endTime: finalEndTime,
      duration,
      amount: Number(tutor.trailRate) || 0,
      notes: dto.notes,
      sessionType: SessionType.TRIAL,
    });
  }

 

  private async processBooking(params: {
    tutorId: string;
    userId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    amount: number;
    notes?: string;
    sessionType: SessionType;
  }) {
    const { tutorId, userId, sessionDate, startTime, endTime, duration, amount, notes, sessionType } = params;

    const lockAcquired = await this.slotLockService.acquireSlotLock(tutorId, sessionDate, startTime, userId);
    if (!lockAcquired) {
      throw new ConflictException('Session slot is locked by another user');
    }

    try {
      const savedSession = await this.sessionRepo.manager.transaction(async manager => {
        await this.checkSlotConflict(manager, tutorId, sessionDate, startTime, endTime);

        const session = manager.create(Session, {
          userId, tutorId, sessionDate, startTime, endTime,
          duration, amount, notes, sessionType,
          status: SessionStatus.PENDING,
        });
        const saved = await manager.save(session);
        return saved;
      });

      return { ...savedSession, message: 'Session created successfully.' };
    } catch (error) {
      await this.slotLockService.releaseSlotLock(tutorId, sessionDate, startTime);
      this.logger.error(`Session creation failed for user ${userId}:`, error);
      throw error;
    } finally {
      await this.slotLockService.releaseSlotLock(tutorId, sessionDate, startTime);
    }
  }

  private async validateTutor(tutorId: string) {
    const tutor = await this.tutorRepo.findOne({ where: { accountId: tutorId } });
    if (!tutor) throw new NotFoundException('Tutor not found');
    return tutor;
  }

  private async validateNoExistingTrial(userId: string, tutorId: string) {
    const sessionSettings = await this.settingsService.getSessionSettings();
    const maxTrials = Number(sessionSettings?.max_trials_per_student_tutor) || 1;

    const trialCount = await this.sessionRepo.count({
      where: { userId, tutorId, sessionType: SessionType.TRIAL },
    });

    if (trialCount >= maxTrials) {
      throw new ConflictException(`You have reached the maximum of ${maxTrials} trial session(s) with this tutor`);
    }
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  }

  private async checkSlotConflict(manager: any, tutorId: string, sessionDate: string, startTime: string, endTime: string) {
    const overlapping = await manager.createQueryBuilder(Session, 'session')
      .where('session.tutorId = :tutorId', { tutorId })
      .andWhere('DATE(session.sessionDate) = DATE(:sessionDate)', { sessionDate })
      .andWhere('session.status IN (:...statuses)', { statuses: [SessionStatus.SCHEDULED] })
      .andWhere('session.startTime < :endTime AND session.endTime > :startTime', { startTime, endTime })
      .getMany();
    if (overlapping.length > 0) throw new ConflictException('Session slot conflict with existing session');
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
      throw new ForbiddenException('You are not allowed to view this session');
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

  // ─── Cancellation helpers (Single Responsibility) ───────────────────

  private getCancellationTier(
    hoursUntilSession: number,
    early: number,
    mid: number,
  ): 'early' | 'mid' | 'late' {
    if (hoursUntilSession >= early) return 'early';
    if (hoursUntilSession >= mid) return 'mid';
    return 'late';
  }

  private calculateRefundAmount(
    sessionAmount: number,
    tier: 'early' | 'mid' | 'late',
    earlyPercent: number,
    midPercent: number,
    latePercent: number,
  ): number {
    const percent =
      tier === 'early' ? earlyPercent :
      tier === 'mid'   ? midPercent   :
                         latePercent;
    return Math.round((Number(sessionAmount) * Number(percent)) / 100 * 100) / 100;
  }

  private async creditWallet(accountId: string, amount: number, note: string): Promise<void> {
    if (amount <= 0) return;

    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ accountId, balance: 0, totalEarnings: 0, totalWithdrawals: 0 });
      wallet = await this.walletRepo.save(wallet);
    }

    const balanceBefore = Number(wallet.balance);
    wallet.balance = balanceBefore + amount;
    wallet.totalEarnings = Number(wallet.totalEarnings) + amount;
    await this.walletRepo.save(wallet);

    await this.walletTxRepo.save(
      this.walletTxRepo.create({
        walletId: wallet.id,
        accountId,
        amount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        balanceBefore,
        balanceAfter: wallet.balance,
        paymentIntentId: note,
      }),
    );
  }

  // ─── Cancel Session ───────────────────────────────────────────────────

  async cancelSession(dto: CancelSessionDto, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['user', 'tutor'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('You are not allowed to cancel this session');
    if (session.status !== SessionStatus.SCHEDULED) throw new BadRequestException('Session cannot be cancelled in its current status');

    const sessionDateTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const hoursUntilSession = (sessionDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    // fetch cancellation rules
    const cancelSettings = await this.settingsService.getCancellationSettings();
    const earlyThreshold = Number(cancelSettings?.early_cancel_threshold_hours) || 8;
    const midThreshold   = Number(cancelSettings?.mid_cancel_threshold_hours)   || 6;
    const earlyPercent   = Number(cancelSettings?.early_cancel_refund_percent)  || 100;
    const midPercent     = Number(cancelSettings?.mid_cancel_credit_percent)    || 50;
    const latePercent    = Number(cancelSettings?.late_cancel_credit_percent)   || 0;

    if (hoursUntilSession < earlyThreshold) {
      throw new BadRequestException(`Cancellation is not allowed within ${earlyThreshold} hours of the session`);
    }

    const tier = this.getCancellationTier(hoursUntilSession, earlyThreshold, midThreshold);
    const refundAmount = this.calculateRefundAmount(
      session.amount, tier, earlyPercent, midPercent, latePercent,
    );

    // cancel session
    session.status      = SessionStatus.CANCELLED;
    session.cancelledAt = new Date();
    session.cancelledBy = userId;
    if (dto.reason) session.notes = dto.reason;
    await this.sessionRepo.save(session);

    // update purchase status
    if (session.purchaseId) {
      const purchase = await this.purchaseRepo.findOne({ where: { id: session.purchaseId } });
      if (purchase && purchase.paymentStatus === PaymentStatus.COMPLETED) {
        purchase.paymentStatus = tier === 'early' ? PaymentStatus.REFUNDED : PaymentStatus.CANCELLED;
        await this.purchaseRepo.save(purchase);
      }
    }

    // credit wallet
    await this.creditWallet(
      userId,
      refundAmount,
      `CANCEL_REFUND_${session.id}`,
    );

    // notifications
    const user = await this.accountRepo.findOne({ where: { id: session.userId }, relations: ['userDetail'] });
    const tutorAccount = await this.accountRepo.findOne({ where: { id: session.tutorId }, relations: ['tutorDetail'] });

    if (user?.email) {
      await this.nodeMailerService.sendSessionCancellationEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorAccount?.tutorDetail?.[0]?.name || 'Tutor',
        { date: session.sessionDate as string, startTime: session.startTime, endTime: session.endTime },
        'student',
        tier === 'early',
      );
    }

    const reasonText = dto.reason ? `: ${dto.reason}` : '';
    await this.notificationsService.create({ title: 'Session Cancelled', desc: `Your session on ${session.sessionDate} at ${session.startTime} has been cancelled${reasonText}`, type: 'SESSION_CANCELLED', accountId: session.userId });
    await this.notificationsService.create({ title: 'Session Cancelled by Student', desc: `Session on ${session.sessionDate} at ${session.startTime} was cancelled by the student${reasonText}`, type: 'SESSION_CANCELLED', accountId: session.tutorId });

    return {
      message: 'Session cancelled successfully.',
      tier,
      refundAmount,
      walletCredited: refundAmount > 0,
      session: {
        ...session,
        user:  { id: user?.id,         name: user?.userDetail?.[0]?.name,         email: user?.email },
        tutor: { id: tutorAccount?.id, name: tutorAccount?.tutorDetail?.[0]?.name, email: tutorAccount?.email },
      },
    };
  }

  // ─── Reschedule helpers (Single Responsibility) ─────────────────────

  private getRescheduleTier(
    hoursUntilSession: number,
    earlyThreshold: number,
    midThreshold: number,
  ): 'early' | 'mid' | 'late' {
    if (hoursUntilSession >= earlyThreshold) return 'early';
    if (hoursUntilSession >= midThreshold) return 'mid';
    return 'late';
  }

  private calculateRescheduleFee(
    sessionAmount: number,
    tier: 'early' | 'mid' | 'late',
    earlyFeePercent: number,
    midFeePercent: number,
    lateFeePercent: number,
  ): number {
    const percent =
      tier === 'early' ? earlyFeePercent :
      tier === 'mid'   ? midFeePercent   :
                         lateFeePercent;
    return Math.round((Number(sessionAmount) * Number(percent)) / 100 * 100) / 100;
  }

  private async debitWallet(accountId: string, amount: number, note: string): Promise<void> {
    if (amount <= 0) return;

    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) throw new BadRequestException('Wallet not found');

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(`Insufficient wallet balance. Available: $${wallet.balance}, Required: $${amount}`);
    }

    const balanceBefore = Number(wallet.balance);
    wallet.balance = balanceBefore - amount;
    await this.walletRepo.save(wallet);

    await this.walletTxRepo.save(
      this.walletTxRepo.create({
        walletId: wallet.id,
        accountId,
        amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.COMPLETED,
        balanceBefore,
        balanceAfter: wallet.balance,
        paymentIntentId: note,
      }),
    );
  }

  // ─── User Reschedule Session ──────────────────────────────────────────

  async userRescheduleSession(sessionId: string, userId: string, dto: RescheduleSessionDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user', 'tutor'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('You are not allowed to reschedule this session');
    if (session.status !== SessionStatus.SCHEDULED) throw new BadRequestException('Session cannot be rescheduled in its current status');

    const rescheduleSettings = await this.settingsService.getRescheduleSettings();

    const earlyThreshold = Number(rescheduleSettings?.reschedule_early_threshold_hours) || 8;
    const midThreshold   = Number(rescheduleSettings?.reschedule_mid_threshold_hours)   || 4;
    const blockThreshold = Number(rescheduleSettings?.reschedule_block_threshold_hours) || 8;
    const maxReschedules = Number(rescheduleSettings?.max_reschedules_per_session)       || 3;
    const earlyFeePercent = Number(rescheduleSettings?.reschedule_early_fee_percent)    || 0;
    const midFeePercent   = Number(rescheduleSettings?.reschedule_mid_fee_percent)      || 25;
    const lateFeePercent  = Number(rescheduleSettings?.reschedule_late_fee_percent)     || 50;

    const hoursUntilSession = (new Date(`${session.sessionDate}T${session.startTime}`).getTime() - Date.now()) / (1000 * 60 * 60);

    // CHECK 1: max reschedules
    if ((session.rescheduleCount || 0) >= maxReschedules) {
      throw new CustomException(MESSAGE_CODES.SESSION_RESCHEDULE_LIMIT_REACHED, MessageType.ERROR, HttpStatus.BAD_REQUEST);
    }

    // CHECK 2: block threshold
    if (hoursUntilSession < blockThreshold) {
      throw new BadRequestException(`Rescheduling is not allowed within ${blockThreshold} hours of the session`);
    }

    const tier = this.getRescheduleTier(hoursUntilSession, earlyThreshold, midThreshold);
    const feeAmount = this.calculateRescheduleFee(session.amount, tier, earlyFeePercent, midFeePercent, lateFeePercent);

    // debit fee from wallet if applicable
    if (feeAmount > 0) {
      await this.debitWallet(userId, feeAmount, `RESCHEDULE_FEE_${session.id}`);
    }

    const oldDate      = session.sessionDate;
    const oldStartTime = session.startTime;
    const oldEndTime   = session.endTime;

    session.sessionDate     = dto.newSessionDate;
    session.startTime       = dto.newStartTime;
    session.endTime         = dto.newEndTime;
    session.duration        = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    session.rescheduleCount = (session.rescheduleCount || 0) + 1;
    await this.sessionRepo.save(session);

    const user = await this.accountRepo.findOne({ where: { id: session.userId }, relations: ['userDetail'] });
    const tutorAccount = await this.accountRepo.findOne({ where: { id: session.tutorId }, relations: ['tutorDetail'] });

    const feeMsg = feeAmount > 0 ? ` A reschedule fee of $${feeAmount} (${tier === 'mid' ? midFeePercent : lateFeePercent}%) was charged.` : ' No extra charges applied.';
    await this.notificationsService.create({ title: 'Session Rescheduled', desc: `Your session has been rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}.${feeMsg}`, type: NotificationType.SESSION_RESCHEDULED, accountId: session.userId });
    await this.notificationsService.create({ title: 'Session Rescheduled by Student', desc: `Session rescheduled from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`, type: NotificationType.SESSION_RESCHEDULED, accountId: session.tutorId });

    if (user?.email) {
      const subjectName = session.tutor?.tutorDetail?.[0]?.subject?.name || null;
      await this.nodeMailerService.sendSessionRescheduleEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorAccount?.tutorDetail?.[0]?.name || 'Tutor',
        { date: oldDate as string, startTime: oldStartTime, endTime: oldEndTime },
        { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime },
        'student',
        subjectName,
        process.env.APP_TIMEZONE || 'UTC',
      );
    }

    return {
      message: 'Session rescheduled successfully.',
      tier,
      feeCharged: feeAmount,
      feePercent: tier === 'early' ? earlyFeePercent : tier === 'mid' ? midFeePercent : lateFeePercent,
      rescheduleCount: session.rescheduleCount,
      oldSchedule: { date: oldDate, startTime: oldStartTime, endTime: oldEndTime },
      newSchedule: { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime },
      session: {
        ...session,
        user:  { id: user?.id,         name: user?.userDetail?.[0]?.name,         email: user?.email },
        tutor: { id: tutorAccount?.id, name: tutorAccount?.tutorDetail?.[0]?.name, email: tutorAccount?.email },
      },
    };
  }

  // ─── Tutor Reschedule Session ─────────────────────────────────────────

  async tutorRescheduleSession(sessionId: string, tutorId: string, dto: RescheduleSessionDto) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user', 'tutor'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.tutorId !== tutorId) throw new ForbiddenException('You are not allowed to reschedule this session');
    if (session.status !== SessionStatus.SCHEDULED) throw new BadRequestException('Session cannot be rescheduled in its current status');

    const rescheduleSettings = await this.settingsService.getRescheduleSettings();
    const minNoticeHours = Number(rescheduleSettings?.tutor_reschedule_min_notice_hours) || 8;
    const maxReschedules = Number(rescheduleSettings?.max_reschedules_per_session) || 3;

    const hoursUntilSession = (new Date(`${session.sessionDate}T${session.startTime}`).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilSession < minNoticeHours) {
      throw new BadRequestException(`Rescheduling is not allowed within ${minNoticeHours} hours of the session`);
    }

    if ((session.rescheduleCount || 0) >= maxReschedules) {
      throw new CustomException(MESSAGE_CODES.SESSION_RESCHEDULE_LIMIT_REACHED, MessageType.ERROR, HttpStatus.BAD_REQUEST);
    }

    const oldDate      = session.sessionDate;
    const oldStartTime = session.startTime;
    const oldEndTime   = session.endTime;

    session.sessionDate     = dto.newSessionDate;
    session.startTime       = dto.newStartTime;
    session.endTime         = dto.newEndTime;
    session.duration        = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    session.rescheduleCount = (session.rescheduleCount || 0) + 1;
    await this.sessionRepo.save(session);

    const user = await this.accountRepo.findOne({ where: { id: session.userId }, relations: ['userDetail'] });
    const tutorAccount = await this.accountRepo.findOne({ where: { id: session.tutorId }, relations: ['tutorDetail'] });
    const tutorName = tutorAccount?.tutorDetail?.[0]?.name || 'Your tutor';
    const timezone = process.env.APP_TIMEZONE || 'UTC';
    const dashboardLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'https://wiznovy.com/dashboard';

    // Notify student
    await this.notificationsService.create({
      title: 'Session Rescheduled by Tutor',
      desc: `Your tutor rescheduled to ${dto.newSessionDate} at ${dto.newStartTime}.`,
      type: NotificationType.SESSION_RESCHEDULED,
      accountId: session.userId,
    });

    // Notify tutor
    await this.notificationsService.create({
      title: 'Session Rescheduled',
      desc: `You rescheduled the session from ${oldDate} ${oldStartTime} to ${dto.newSessionDate} ${dto.newStartTime}`,
      type: NotificationType.SESSION_RESCHEDULED,
      accountId: session.tutorId,
    });

    // Email student
    if (user?.email) {
      const subjectName = session.tutor?.tutorDetail?.[0]?.subject?.name || null;
      await this.nodeMailerService.sendSessionRescheduleEmail(
        user.email,
        user.userDetail?.[0]?.name || 'Student',
        tutorName,
        { date: oldDate as string, startTime: oldStartTime, endTime: oldEndTime },
        { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime },
        'tutor',
        subjectName,
        process.env.APP_TIMEZONE || 'UTC',
      );
    }

    return {
      message: 'Session rescheduled successfully.',
      rescheduleCount: session.rescheduleCount,
      remainingReschedules: maxReschedules - session.rescheduleCount,
      oldSchedule: { date: oldDate, startTime: oldStartTime, endTime: oldEndTime },
      newSchedule: { date: dto.newSessionDate, startTime: dto.newStartTime, endTime: dto.newEndTime },
      session: {
        ...session,
        user:  { id: user?.id,         name: user?.userDetail?.[0]?.name,         email: user?.email },
        tutor: { id: tutorAccount?.id, name: tutorAccount?.tutorDetail?.[0]?.name, email: tutorAccount?.email },
      },
    };
  }

  // ─── Tutor Cancel Session ─────────────────────────────────────────────

  async tutorCancelSession(sessionId: string, tutorId: string, reason?: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user', 'tutor'],
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.tutorId !== tutorId) throw new ForbiddenException('You are not allowed to cancel this session');
    if (session.status !== SessionStatus.SCHEDULED) throw new BadRequestException('Session cannot be cancelled in its current status');

    const hoursUntilSession = (new Date(`${session.sessionDate}T${session.startTime}`).getTime() - Date.now()) / (1000 * 60 * 60);

    const cancelSettings = await this.settingsService.getCancellationSettings();
    const minNoticeHours = Number(cancelSettings?.tutor_self_cancel_min_notice_hours) || 24;

    if (hoursUntilSession < minNoticeHours) {
      throw new BadRequestException(`Tutor must cancel at least ${minNoticeHours} hours before the session`);
    }

    // cancel session
    session.status      = SessionStatus.CANCELLED;
    session.cancelledAt = new Date();
    session.cancelledBy = tutorId;
    if (reason) session.notes = reason;
    await this.sessionRepo.save(session);

    // 100% refund to user wallet
    const refundAmount = Number(session.amount);
    await this.creditWallet(session.userId, refundAmount, `TUTOR_CANCEL_REFUND_${session.id}`);

    // update purchase
    if (session.purchaseId) {
      const purchase = await this.purchaseRepo.findOne({ where: { id: session.purchaseId } });
      if (purchase && purchase.paymentStatus === PaymentStatus.COMPLETED) {
        purchase.paymentStatus = PaymentStatus.REFUNDED;
        await this.purchaseRepo.save(purchase);
      }
    }

    const user = await this.accountRepo.findOne({ where: { id: session.userId }, relations: ['userDetail'] });
    const tutorAccount = await this.accountRepo.findOne({ where: { id: session.tutorId }, relations: ['tutorDetail'] });

    const reasonText = reason ? `: ${reason}` : '';
    await this.notificationsService.create({ title: 'Session Cancelled by Tutor', desc: `Your session on ${session.sessionDate} at ${session.startTime} was cancelled by the tutor${reasonText}. Full refund credited to your wallet.`, type: 'SESSION_CANCELLED', accountId: session.userId });
    await this.notificationsService.create({ title: 'Session Cancelled', desc: `You cancelled the session on ${session.sessionDate} at ${session.startTime}${reasonText}`, type: 'SESSION_CANCELLED', accountId: session.tutorId });

    return {
      message: 'Session cancelled successfully.',
      refundAmount,
      walletCredited: true,
      reason: reason || null,
      session: {
        ...session,
        user:  { id: user?.id,         name: user?.userDetail?.[0]?.name,         email: user?.email },
        tutor: { id: tutorAccount?.id, name: tutorAccount?.tutorDetail?.[0]?.name, email: tutorAccount?.email },
      },
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



  async rescheduleSession(dto: RescheduleSessionDto, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId },
      relations: ['user', 'tutor']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You are not allowed to reschedule this session');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Session cannot be rescheduled in its current status');


    }

    const availableSlots = await this.tutorAvailabilityService.getAvailableBookingSlots(
      session.tutorId, 
      dto.newSessionDate
    );

    const isSlotAvailable = availableSlots.slots.some(slot => 
      slot.start === dto.newStartTime && slot.end === dto.newEndTime
    );

    if (!isSlotAvailable) {
      throw new ConflictException('Selected time slot is not available');
    }

    const oldDate = session.sessionDate;
    const oldStartTime = session.startTime;
    const oldEndTime = session.endTime;

    session.sessionDate = dto.newSessionDate;
    session.startTime = dto.newStartTime;
    session.endTime = dto.newEndTime;
    session.duration = this.calculateDuration(dto.newStartTime, dto.newEndTime);
    session.rescheduleCount = (session.rescheduleCount || 0) + 1;
    
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
          date: oldDate as string,
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
        const sessionDateStr = session.sessionDate as string;
          
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
        const sessionDateStr = session.sessionDate as string;
          
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
    return Math.round(Number(hourlyRate) * hourlyFraction * 100) / 100;
  }

  

 

  async findSessionsByAccountId(accountId: string, dto: SessionPaginationDto) {
    const queryBuilder = this.sessionRepo.createQueryBuilder('session')
      .leftJoin('session.user', 'user')
      .leftJoin('user.userDetail', 'userDetail')
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
        'user.id', 'user.email',
        'userDetail.name',
        'tutor.id', 'tutor.email',
        'tutorDetail.name', 'tutorDetail.profileImage',
        'zoomMeeting.meetingId', 'zoomMeeting.joinUrl', 'zoomMeeting.startUrl',
      ])
      .where('session.userId = :accountId OR session.tutorId = :accountId', { accountId });

    if (dto.status) {
      queryBuilder.andWhere('session.status = :status', { status: dto.status });
    }

    if (dto.fromDate) {
      queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: dto.fromDate });
    }

    if (dto.toDate) {
      queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: dto.toDate });
    }

    const [result, total] = await queryBuilder
      .orderBy('session.sessionDate', 'DESC')
      .addOrderBy('session.startTime', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
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
        'tutor.id',  'tutor.email',
        'tutorDetail.name', 'tutorDetail.tutorId', 'tutorDetail.profileImage',
        'zoomMeeting.meetingId', 'zoomMeeting.joinUrl', 'zoomMeeting.startUrl'
      ]);



      if (dto.keyword) {
      queryBuilder.andWhere(
        '(userDetail.name LIKE :keyword OR tutorDetail.name LIKE :keyword)',
        { keyword: `%${dto.keyword}%` }
      );
    }

    if (dto.status) {
      queryBuilder.andWhere('session.status = :status', { status: dto.status });
    }

    if (dto.sessionType) {
      queryBuilder.andWhere('session.sessionType = :sessionType', { sessionType: dto.sessionType });
    }

    if (dto.date) {
      queryBuilder.andWhere('DATE(session.sessionDate) = :date', { date: dto.date });
    } else {
      // date range presets
      const now = new Date();
      if (dto.fromDate && dto.toDate) {
        queryBuilder.andWhere('session.sessionDate BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
      } else if (dto.fromDate) {
        queryBuilder.andWhere('session.sessionDate >= :fromDate', { fromDate: dto.fromDate });
      } else if (dto.toDate) {
        queryBuilder.andWhere('session.sessionDate <= :toDate', { toDate: dto.toDate });
      }
    }

    if (dto.accountId) {
      queryBuilder.andWhere('(session.userId = :accountId OR session.tutorId = :accountId)', { accountId: dto.accountId });
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

    session.sessionDate = dto.newSessionDate;
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
      throw new BadRequestException('Session cannot be cancelled in its current status');
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
          date: session.sessionDate as string,
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
          date: session.sessionDate as string,
          startTime: session.startTime,
          endTime: session.endTime
        },
        'tutor',
        true
      );
    }

 const reasonText = dto.reason ? `: ${dto.reason}` : '';

await this.notificationsService.create({
  title: 'Session Cancelled by Admin',
  desc: `Your session on ${session.sessionDate} at ${session.startTime} has been cancelled by admin${reasonText}`,
  type: 'SESSION_CANCELLED',
  accountId: session.userId
});

await this.notificationsService.create({
  title: 'Session Cancelled by Admin',
  desc: `Session on ${session.sessionDate} at ${session.startTime} was cancelled by admin${reasonText}`,
  type: 'SESSION_CANCELLED',
  accountId: session.tutorId
});


   
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
    const tutor = await this.validateTutor(dto.tutorId);

    const user = await this.accountRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const sessionSettings = await this.settingsService.getSessionSettings();
    let duration: number;
    let sessionPrice: number;

    if (dto.sessionType === SessionType.TRIAL) {
      duration = Number(sessionSettings?.trial_duration_minutes);
      sessionPrice = Number(tutor.trailRate) || 0;
    } else {
      duration = Number(sessionSettings?.regular_session_duration_minutes);
      sessionPrice = this.calculateSessionPrice(tutor.hourlyRate, duration, dto.sessionType);
    }

    const finalEndTime = this.calculateEndTime(dto.startTime, duration);

    const session = this.sessionRepo.create({
      userId: dto.userId,
      tutorId: dto.tutorId,
      sessionDate: dto.sessionDate,
      startTime: dto.startTime,
      endTime: finalEndTime,
      duration,
      amount: sessionPrice,
      notes: dto.notes || 'Manually created by admin',
      sessionType: dto.sessionType,
      status: SessionStatus.SCHEDULED,
    });

    const savedSession = await this.sessionRepo.save(session);

    await this.notificationsService.create({
      title: 'New Session Created',
      desc: `A session has been scheduled for ${dto.sessionDate} at ${dto.startTime}`,
      type: 'SESSION_BOOKED',
      accountId: dto.userId,
    });

    await this.notificationsService.create({
      title: 'New Session Assigned',
      desc: `You have a new session on ${dto.sessionDate} at ${dto.startTime}`,
      type: 'SESSION_BOOKED',
      accountId: dto.tutorId,
    });

    return { message: 'Session created successfully by admin', session: savedSession };
  }

  async exportSessionsCsv(dto: ExportStudentsCsvDto): Promise<{ csv: string; fileName: string }> {
    const { startDate, endDate } = this.resolveDateRange(dto);
    const COMMISSION_RATE = 0.25;

    const qb = this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('tutorDetail.subject', 'subject');

    if (startDate) qb.andWhere('session.createdAt >= :startDate', { startDate });
    if (endDate)   qb.andWhere('session.createdAt <= :endDate',   { endDate });
    qb.orderBy('session.createdAt', 'DESC');

    const sessions = await qb.getMany();

    const ud = (r: any) => Array.isArray(r.user?.userDetail) ? r.user.userDetail[0] : r.user?.userDetail;
    const td = (r: any) => Array.isArray(r.tutor?.tutorDetail) ? r.tutor.tutorDetail[0] : r.tutor?.tutorDetail;

    const formatTime = (time: string) => {
      if (!time) return '';
      const [h, m] = time.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const cancelledByLabel = (r: any) => {
      if (!r.cancelledBy) return '';
      if (r.cancelledBy === r.userId)  return 'Student';
      if (r.cancelledBy === r.tutorId) return 'Tutor';
      return 'Admin';
    };

    const columns: CsvColumn[] = [
      { header: 'Session ID',              value: r => r.id },
      { header: 'Session Date',            value: r => r.sessionDate || '' },
      { header: 'Session Time',            value: r => formatTime(r.startTime) },
      { header: 'Duration (mins)',         value: r => r.duration ?? '' },
      { header: 'Session Type',            value: r => r.sessionType === SessionType.TRIAL ? 'Trial' : 'Regular' },
      { header: 'Status',                  value: r => r.status || '' },
      { header: 'Student Name',            value: r => ud(r)?.name || '' },
      { header: 'Student ID',              value: r => ud(r)?.userId || '' },
      { header: 'Tutor Name',              value: r => td(r)?.name || '' },
      { header: 'Tutor ID',                value: r => td(r)?.tutorId || '' },
      { header: 'Subject',                 value: r => td(r)?.subject?.name || '' },
      { header: 'Amount Paid (USD)',        value: r => r.amount ?? '' },
      { header: 'Platform Commission',     value: r => r.amount ? (r.amount * COMMISSION_RATE).toFixed(2) : '' },
      { header: 'Tutor Earnings',          value: r => r.amount ? (r.amount * (1 - COMMISSION_RATE)).toFixed(2) : '' },
      { header: 'Cancellation Reason',     value: r => r.status === 'CANCELLED' ? (r.notes || '') : '' },
      { header: 'Cancelled By',            value: r => r.status === 'CANCELLED' ? cancelledByLabel(r) : '' },
      { header: 'Refund Amount',           value: r => '' },
      { header: 'Booking Date',            value: r => formatCsvDate(r.createdAt) },
    ];

    const csv      = buildCsv(columns, sessions);
    const fileName = generateCsvFileName('wiznovy-sessions-export');
    return { csv, fileName };
  }

  private resolveDateRange(dto: ExportStudentsCsvDto): { startDate: Date | null; endDate: Date | null } {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dto.preset) {
      case DateRangePreset.THIS_WEEK: {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        return { startDate: start, endDate: now };
      }
      case DateRangePreset.LAST_WEEK: {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      case DateRangePreset.LAST_MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      case DateRangePreset.LAST_3_MONTHS: {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { startDate: start, endDate: now };
      }
      case DateRangePreset.CUSTOM:
        return {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate:   dto.endDate   ? new Date(dto.endDate)   : null,
        };
      default:
        return { startDate: null, endDate: null };
    }
  }
}

