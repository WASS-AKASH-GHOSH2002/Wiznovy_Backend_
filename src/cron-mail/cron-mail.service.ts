import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { TwentyFourHourReminderPayload, ExpiryWarningPayload, ExpiredPayload, ZoomLinkReminderPayload, TenMinReminderPayload } from './cron-mail.interfaces';
import { twentyFourHourReminderTemplate, expiryWarningTemplate, expiredTemplate, zoomLinkReminderTemplate, tenMinReminderTemplate } from './cron-mail.templates';

@Injectable()
export class CronMailService {
  private readonly logger = new Logger(CronMailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendTwentyFourHourReminder(payload: TwentyFourHourReminderPayload): Promise<void> {
    const { email, firstName, role, tutorName, subject } = payload;
    const subjectLine = role === 'student'
      ? `Reminder: Session tomorrow with ${tutorName}`
      : `Reminder: Session tomorrow with ${payload.studentName}`;
    try {
      await this.mailer.sendMail({
        to: email,
        subject: subjectLine,
        html: twentyFourHourReminderTemplate(firstName, role, payload.studentName, tutorName, subject, payload.date, payload.time, payload.timezone, payload.dashboardLink),
      });
    } catch (error) {
      this.logger.error(`Failed to send 24h reminder to ${email}`, error);
    }
  }

  async sendExpiryWarning(payload: ExpiryWarningPayload): Promise<void> {
    const { email, itemName, daysLeft } = payload;
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Content Expiring Soon - Wiznovy',
        html: expiryWarningTemplate(itemName, daysLeft),
      });
    } catch (error) {
      this.logger.error(`Failed to send expiry warning to ${email}`, error);
    }
  }

  async sendExpired(payload: ExpiredPayload): Promise<void> {
    const { email, itemName } = payload;
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Content Expired - Wiznovy',
        html: expiredTemplate(itemName),
      });
    } catch (error) {
      this.logger.error(`Failed to send expired notice to ${email}`, error);
    }
  }

  async sendZoomLinkReminder(payload: ZoomLinkReminderPayload): Promise<void> {
    const { email, firstName, subject, date, time, timezone, zoomLink, meetingId, passcode } = payload;
    try {
      await this.mailer.sendMail({
        to: email,
        subject: `Your Zoom link for ${subject} session`,
        html: zoomLinkReminderTemplate(firstName, subject, date, time, timezone, zoomLink, meetingId, passcode),
      });
    } catch (error) {
      this.logger.error(`Failed to send Zoom link reminder to ${email}`, error);
    }
  }

  async sendTenMinReminder(payload: TenMinReminderPayload): Promise<void> {
    const { email, firstName, role, tutorName, subject, zoomLink } = payload;
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Session starting now!',
        html: tenMinReminderTemplate(firstName, role, tutorName, subject, zoomLink),
      });
    } catch (error) {
      this.logger.error(`Failed to send 10-min reminder to ${email}`, error);
    }
  }
}
