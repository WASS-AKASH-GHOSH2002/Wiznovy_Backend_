import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from 'src/enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly httpService: HttpService,
  ) {}

  async sendBulkNotification(body, title, token, status) {
    const header = {
      headers: {
        'cache-control': 'no-cache',
        authorization: `key=${process.env.FCM_SERVER_KEY}`,
        'content-type': 'application/json',
      },
    };
    let data = null;
    if (status) {
      data = JSON.stringify({
        registration_ids: token,
        data: { body: body, title: title, sound: 'default', type: 1 },
        notification: { body: body, title: title, sound: 'default', type: 1 },
      });
    } else {
      data = JSON.stringify({
        to: token,
        data: { body: body, title: title, sound: 'default', type: 1 },
        notification: { body: body, title: title, sound: 'default', type: 1 },
      });
    }

    try {
      const result = await this.httpService.axiosRef.post(
        `https://fcm.googleapis.com/fcm/send`,
        data,
        header,
      );
      if (result.data) {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to send bulk notification:', error);
      return false;
    }
  }

  async create(createDto) {
    const result = await this.repo.count({
      where: {
        title: createDto.title,
        desc: createDto.desc,
        type: createDto.type,
        accountId: createDto.accountId,
      },
    });

    if (result === 0) {
      return this.repo.save(createDto);
    } else {
      return true;
    }
  }

  async findAll(limit: number, offset: number, accountId: string) {
    const [result, total] = await this.repo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.account', 'account')
      .where('notification.accountId = :accountId', { accountId })
      .skip(offset)
      .take(limit)
      .orderBy({ 'notification.createdAt': 'DESC' })
      .getManyAndCount();
    return { result, total };
  }

  async find(limit: number, offset: number) {
    const [result, total] = await this.repo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.account', 'account')
      .skip(offset)
      .take(limit)
      .orderBy({ 'notification.createdAt': 'DESC' })
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: number, accountId: string) {
    const notification = await this.repo.findOne({ where: { id, accountId } });
    if (!notification) throw new NotFoundException('Notification not found!');
    return notification;
  }

  async update(id: number, accountId: string, status: boolean) {
    const notifs = await this.repo.findOne({ where: { id, accountId } });
    if (!notifs) {
      throw new NotFoundException('Notification not found!');
    }
    const obj = Object.assign(notifs, { read: status });
    return this.repo.save(obj);
  }



  async notifyAdminNewUser(userEmail: string) {
    await this.create({
      title: 'New User Registration',
      desc: `New user registered: ${userEmail}`,
      type: NotificationType.NEW_USER,
      accountId: null
    });
  }

  async notifyAdminNewTutorApplication(tutorName: string, subject: string, adminIds: string[]) {
    await Promise.all(adminIds.map(accountId => this.create({
      title: 'New Tutor Application',
      desc: `${tutorName} (${subject}) is awaiting approval. Tap to review.`,
      type: NotificationType.NEW_USER,
      accountId,
    })));
  }



  async notifyUserPurchase(accountId: string, itemName: string) {
    await this.create({
      title: 'Purchase Successful',
      desc: `You have successfully purchased ${itemName}`,
      type: NotificationType.PAYMENT_SUCCESS,
      accountId
    });
  }

  async notifyUserExpiringSoon(accountId: string, itemName: string, daysLeft: number) {
    await this.create({
      title: 'Content Expiring Soon',
      desc: `Your access to ${itemName} expires in ${daysLeft} days. Buy again to continue!`,
      type: NotificationType.EXPIRY_WARNING,
      accountId
    });
  }

  async notifyUserCoupon(accountId: string, couponCode: string) {
    await this.create({
      title: 'New Coupon Available',
      desc: `Use coupon code ${couponCode} for discount on your next purchase`,
      type: NotificationType.COUPON,
      accountId
    });
  }

  async notifySessionBooked(accountId: string, tutorName: string, sessionDate: string, startTime: string) {
    await this.create({
      title: 'Session Booked Successfully',
      desc: `Your session with ${tutorName} is confirmed for ${sessionDate} at ${startTime}`,
      type: NotificationType.SESSION_BOOKED,
      accountId
    });
  }

  async notifyTutorNewBooking(tutorId: string, studentName: string, subject: string, sessionDate: string, startTime: string) {
    await this.create({
      title: 'New Booking',
      desc: `${studentName} booked a ${subject} session on ${sessionDate} at ${startTime}.`,
      type: NotificationType.SESSION_BOOKED,
      accountId: tutorId,
    });
  }

  async notifyTrialSessionBooked(accountId: string, tutorName: string, sessionDate: string, startTime: string) {
    await this.create({
      title: 'Trial Session Confirmed',
      desc: `Your 25-min trial with ${tutorName} on ${sessionDate} at ${startTime} is confirmed.`,
      type: NotificationType.SESSION_BOOKED,
      accountId,
    });
  }

  async notifyTutorTrialBooking(tutorId: string, studentName: string, sessionDate: string, startTime: string) {
    await this.create({
      title: 'New Trial Booking',
      desc: `${studentName} booked a 25-min trial session on ${sessionDate} at ${startTime}.`,
      type: NotificationType.SESSION_BOOKED,
      accountId: tutorId,
    });
  }

  async notifyEnrolledSuccessfully(accountId: string, courseName: string, tutorName: string) {
    await this.create({
      title: 'Enrolled Successfully',
      desc: `You are now enrolled in "${courseName}" by ${tutorName}.`,
      type: NotificationType.MY_LEARNING,
      accountId,
    });
  }

  async notifyTutorCourseEnrollment(tutorId: string, studentName: string, courseName: string) {
    await this.create({
      title: 'New Course Enrollment',
      desc: `${studentName} enrolled in your course "${courseName}."`,
      type: NotificationType.COURSE_ANALYTICS,
      accountId: tutorId,
    });
  }

  async notifyCourseApproved(tutorId: string, courseName: string) {
    await this.create({
      title: 'Course Approved',
      desc: `Your course "${courseName}" is now live and visible to students.`,
      type: NotificationType.COURSE_PAGE,
      accountId: tutorId,
    });
  }

  async notifyCourseNeedsRevisions(tutorId: string, courseName: string, rejectionReason: string) {
    await this.create({
      title: 'Course Needs Revisions',
      desc: `Your course "${courseName}" needs changes. Reason: ${rejectionReason}.`,
      type: NotificationType.COURSE_PAGE,
      accountId: tutorId,
    });
  }

  async notifyCourseSubmittedForReview(tutorId: string, courseName: string) {
    await this.create({
      title: 'Course Submitted for Review',
      desc: `Your course "${courseName}" has been submitted for admin approval.`,
      type: NotificationType.COURSE_PAGE,
      accountId: tutorId,
    });
  }

  async notifyBookSubmittedForReview(tutorId: string, bookTitle: string) {
    await this.create({
      title: 'Book Submitted for Review',
      desc: `Your book "${bookTitle}" has been submitted. Admin approval required before visible.`,
      type: NotificationType.COURSE_PAGE,
      accountId: tutorId,
    });
  }

  async notifySessionReminder(accountId: string, tutorName: string, sessionDate: string, startTime: string, hoursUntil: number) {
    await this.create({
      title: `Session Reminder - ${hoursUntil}h`,
      desc: `Your session with ${tutorName} starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} (${sessionDate} at ${startTime})`,
      type: NotificationType.SESSION_REMINDER,
      accountId
    });
  }

  async notifyPaymentSuccess(accountId: string, itemName: string, amount: number, transactionId?: string) {
    await this.create({
      title: 'Payment Confirmed',
      desc: `Your payment of $${amount} was successful. Transaction: ${transactionId || 'N/A'}.`,
      type: NotificationType.PAYMENT_SUCCESS,
      accountId,
    });
  }

  async notifyPaymentFailed(accountId: string, itemName: string, amount: number) {
    await this.create({
      title: 'Payment Failed',
      desc: `Your payment of $${amount} could not be processed. Tap to update payment method.`,
      type: NotificationType.PAYMENT_FAILED,
      accountId,
    });
  }

  async notifyRefundProcessed(accountId: string, amount: number, reason: string) {
    await this.create({
      title: 'Refund Processed',
      desc: `Refund of ₹${amount} has been processed for ${reason}`,
      type: NotificationType.REFUND_PROCESSED,
      accountId
    });
  }


  async notifyPayoutApproved(tutorId: string, amount: number) {
    await this.create({
      title: 'Payout Approved',
      desc: `Your payout request of $${amount} has been approved and processed.`,
      type: NotificationType.PAYOUT_APPROVED,
      accountId: tutorId,
    });
  }

  async notifyPayoutRejected(tutorId: string, amount: number, reason: string) {
    await this.create({
      title: 'Payout Rejected',
      desc: `Your payout request of $${amount} has been rejected. Reason: ${reason}.`,
      type: NotificationType.PAYOUT_REJECTED,
      accountId: tutorId,
    });
  }
  async getAdminNotifications(accountId: string, dto: { limit: number; offset: number; fromDate?: string; toDate?: string; read?: boolean }) {
    const queryBuilder = this.repo
      .createQueryBuilder('notification')
      .where('notification.accountId IS NULL OR notification.accountId = :accountId', { accountId });

    if (dto.read !== undefined)
      queryBuilder.andWhere('notification.read = :read', { read: dto.read });
    if (dto.fromDate && dto.toDate)
      queryBuilder.andWhere('DATE(notification.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
    else if (dto.fromDate)
      queryBuilder.andWhere('DATE(notification.createdAt) >= :fromDate', { fromDate: dto.fromDate });
    else if (dto.toDate)
      queryBuilder.andWhere('DATE(notification.createdAt) <= :toDate', { toDate: dto.toDate });

    const [result, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async markAllAsRead(accountId: string) {
    await this.repo.update(
      { accountId, read: false },
      { read: true }
    );
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(accountId: string) {
    const count = await this.repo.count({
      where: { accountId, read: false }
    });
    return { unreadCount: count };
  }

  async deleteNotification(id: number, accountId: string) {
    const notification = await this.repo.findOne({ where: { id, accountId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    await this.repo.remove(notification);
    return { message: 'Notification deleted successfully' };
  }

  async getNotificationsSince(accountId: string, since: Date) {
    const notifications = await this.repo.createQueryBuilder('notification')
      .where('notification.accountId = :accountId', { accountId })
      .andWhere('notification.createdAt >= :since', { since })
      .orderBy('notification.createdAt', 'DESC')
      .getMany();
    return { notifications, count: notifications.length };
  }

  async sendPushNotification(accountId: string, title: string, body: string, data?: any) {
    try {
      await this.sendBulkNotification(body, title, accountId, false);
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  async notifyNewMessage(receiverId: string, senderName: string, messagePreview: string) {
    await this.create({
      title: `New Message from ${senderName}`,
      desc: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      type: NotificationType.NEW_MESSAGE,
      accountId: receiverId
    });
  }

  async notifySessionCancelled(accountId: string, tutorName: string, sessionDate: string, startTime: string, cancelledBy: string) {
    await this.create({
      title: 'Session Cancelled',
      desc: `Your session with ${tutorName} on ${sessionDate} at ${startTime} was cancelled ${cancelledBy === 'tutor' ? 'by the tutor' : ''}`,
      type: NotificationType.SESSION_CANCELLED,
      accountId
    });
  }

  async notifySessionRescheduled(accountId: string, tutorName: string, oldDate: string, oldTime: string, newDate: string, newTime: string, rescheduledBy: string) {
    await this.create({
      title: 'Session Rescheduled',
      desc: `Your session with ${tutorName} has been moved from ${oldDate} ${oldTime} to ${newDate} ${newTime} ${rescheduledBy === 'tutor' ? 'by the tutor' : ''}`,
      type: NotificationType.SESSION_RESCHEDULED,
      accountId
    });
  }


}

