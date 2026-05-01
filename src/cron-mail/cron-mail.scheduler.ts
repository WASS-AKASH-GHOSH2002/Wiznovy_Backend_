import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session } from 'src/session/entities/session.entity';
import { UserPurchase } from 'src/user-purchase/entities/user-purchase.entity';
import { ZoomMeeting } from 'src/zoom/entities/zoom.entity';
import { SessionStatus, PaymentStatus } from 'src/enum';
import { CronMailService } from './cron-mail.service';
import { CronExpression, CronTimeWindow } from './cron-schedule.constants';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class CronMailScheduler {
  private readonly logger = new Logger(CronMailScheduler.name);

  constructor(
    private readonly cronMailService: CronMailService,
    private readonly walletService: WalletService,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(UserPurchase) private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(ZoomMeeting) private readonly zoomRepo: Repository<ZoomMeeting>,
  ) {}

  @Cron(CronExpression.DAILY_9AM)
  async handleReleasePendingEarnings(): Promise<void> {
    this.logger.log('Running tutor pending earnings release cron');
    try {
      await this.walletService.releaseMaturePendingEarnings();
    } catch (error) {
      this.logger.error('Pending earnings release cron failed', error);
    }
  }

  @Cron(CronExpression.DAILY_9AM)
  async handle24HourReminders(): Promise<void> {
    this.logger.log('Running 24h session reminder cron');
    try {
      await this.send24HourReminders();
    } catch (error) {
      this.logger.error('24h session reminder cron failed', error);
    }
  }

  @Cron(CronExpression.EVERY_2_MINUTES)
  async handleTenMinReminders(): Promise<void> {
    this.logger.log('Running 10-min session reminder cron');
    try {
      await this.sendTenMinReminders();
    } catch (error) {
      this.logger.error('10-min session reminder cron failed', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleZoomLinkReminders(): Promise<void> {
    this.logger.log('Running Zoom link reminder cron');
    try {
      await this.sendZoomLinkReminders();
    } catch (error) {
      this.logger.error('Zoom link reminder cron failed', error);
    }
  }

  @Cron(CronExpression.DAILY_8AM)
  async handleExpiryNotifications(): Promise<void> {
    this.logger.log('Running expiry notification cron');
    try {
      await this.sendExpiryWarnings(CronTimeWindow.EXPIRY_WARNING_3_DAYS);
      await this.sendExpiryWarnings(CronTimeWindow.EXPIRY_WARNING_1_DAY);
      await this.sendExpiredNotices();
    } catch (error) {
      this.logger.error('Expiry notification cron failed', error);
    }
  }

  private async sendTenMinReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + CronTimeWindow.TEN_MIN_BEFORE_MIN * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + CronTimeWindow.TEN_MIN_AFTER_MIN   * 60 * 1000);
    const format = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

    const sessions = await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('session.zoomMeeting', 'zoomMeeting')
      .where('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('session.tenMinReminderSent = :sent', { sent: false })
      .andWhere('CONCAT(session.sessionDate, " ", session.startTime) BETWEEN :start AND :end', {
        start: format(windowStart),
        end:   format(windowEnd),
      })
      .getMany();

    for (const session of sessions) {
      const zoom        = session.zoomMeeting;
      const subject     = zoom?.topic || 'Session';
      const studentName = session.user?.userDetail?.[0]?.name || 'Student';
      const tutorName   = session.tutor?.tutorDetail?.[0]?.name || 'Tutor';

      if (session.user?.email) {
        await this.cronMailService.sendTenMinReminder({
          email:      session.user.email,
          firstName:  studentName.split(' ')[0],
          role:       'student',
          tutorName,
          subject,
          zoomLink:   zoom?.joinUrl || '',
        });
      }

      if (session.tutor?.email) {
        await this.cronMailService.sendTenMinReminder({
          email:      session.tutor.email,
          firstName:  tutorName.split(' ')[0],
          role:       'tutor',
          tutorName,
          subject,
          zoomLink:   zoom?.startUrl || '',
        });
      }

      await this.sessionRepo.update(session.id, { tenMinReminderSent: true });
    }
  }

  private async sendZoomLinkReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + CronTimeWindow.ZOOM_REMINDER_BEFORE_MIN * 60 * 1000);
    const windowEnd = new Date(now.getTime() + CronTimeWindow.ZOOM_REMINDER_AFTER_MIN * 60 * 1000);
    const format = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

    const sessions = await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('session.zoomMeeting', 'zoomMeeting')
      .where('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('CONCAT(session.sessionDate, " ", session.startTime) BETWEEN :start AND :end', {
        start: format(windowStart),
        end: format(windowEnd),
      })
      .getMany();

    for (const session of sessions) {
      const zoom = session.zoomMeeting;
      if (!zoom || zoom.reminderSent) continue;

      const subject = zoom.topic || 'Session';
      const date = session.sessionDate as string;
      const time = session.startTime;
      const timezone = 'UTC';
      const zoomLink = zoom.joinUrl;
      const meetingId = zoom.meetingId;
      const passcode = zoom.password || 'N/A';

      if (session.user?.email) {
        const firstName = session.user.userDetail?.[0]?.name?.split(' ')[0] || 'Student';
        await this.cronMailService.sendZoomLinkReminder({ email: session.user.email, firstName, subject, date, time, timezone, zoomLink, meetingId, passcode });
      }

      if (session.tutor?.email) {
        const firstName = session.tutor.tutorDetail?.[0]?.name?.split(' ')[0] || 'Tutor';
        await this.cronMailService.sendZoomLinkReminder({ email: session.tutor.email, firstName, subject, date, time, timezone, zoomLink: zoom.startUrl, meetingId, passcode });
      }

      await this.zoomRepo.update(zoom.id, { reminderSent: true });
    }
  }

  private async send24HourReminders(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + CronTimeWindow.REMINDER_24H_BEFORE_MIN * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + CronTimeWindow.REMINDER_24H_AFTER_MIN  * 60 * 1000);
    const format = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');
    const dashboardLink = `${process.env.FRONTEND_URL ?? 'https://wiznovy.com'}/dashboard`;

    const sessions = await this.sessionRepo.createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('session.tutor', 'tutor')
      .leftJoinAndSelect('tutor.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('session.zoomMeeting', 'zoomMeeting')
      .where('session.status = :status', { status: SessionStatus.SCHEDULED })
      .andWhere('session.twentyFourHourReminderSent = :sent', { sent: false })
      .andWhere('CONCAT(session.sessionDate, " ", session.startTime) BETWEEN :start AND :end', {
        start: format(windowStart),
        end:   format(windowEnd),
      })
      .getMany();

    for (const session of sessions) {
      if (!session.user?.email && !session.tutor?.email) continue;

      const studentName = session.user?.userDetail?.[0]?.name || 'Student';
      const tutorName   = session.tutor?.tutorDetail?.[0]?.name || 'Tutor';
      const subject     = session.zoomMeeting?.topic || 'Session';
      const date        = session.sessionDate as string;
      const time        = session.startTime;
      const timezone    = 'UTC';

      if (session.user?.email) {
        await this.cronMailService.sendTwentyFourHourReminder({
          email: session.user.email,
          firstName: studentName.split(' ')[0],
          role: 'student',
          studentName,
          tutorName,
          subject,
          date,
          time,
          timezone,
          dashboardLink,
        });
      }

      if (session.tutor?.email) {
        await this.cronMailService.sendTwentyFourHourReminder({
          email: session.tutor.email,
          firstName: tutorName.split(' ')[0],
          role: 'tutor',
          studentName,
          tutorName,
          subject,
          date,
          time,
          timezone,
          dashboardLink,
        });
      }

      await this.sessionRepo.update(session.id, { twentyFourHourReminderSent: true });
    }
  }

  private async sendExpiryWarnings(daysLeft: number): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + daysLeft);
    windowEnd.setHours(23, 59, 59, 999);

    const purchases = await this.purchaseRepo.find({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        expiresAt: Between(windowStart, windowEnd),
      },
      relations: ['account', 'course'],
    });

    for (const purchase of purchases) {
      if (!purchase.account?.email) continue;
      await this.cronMailService.sendExpiryWarning({
        email: purchase.account.email,
        itemName: purchase.course?.name || 'Your course',
        daysLeft,
      });
    }
  }

  private async sendExpiredNotices(): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const purchases = await this.purchaseRepo.find({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        expiresAt: Between(yesterday, yesterdayEnd),
      },
      relations: ['account', 'course'],
    });

    for (const purchase of purchases) {
      if (!purchase.account?.email) continue;
      await this.cronMailService.sendExpired({
        email: purchase.account.email,
        itemName: purchase.course?.name || 'Your course',
      });
    }
  }
}
