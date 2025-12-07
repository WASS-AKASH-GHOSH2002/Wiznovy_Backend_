import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

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
        authorization:
          'key=AAAAqKmoPwY:APA91bEuJpsVMvfhzcwPbXUV3B6Wu6kQl8iA6738dXuvdMHSELGZegyGLc90uP0LqTSGkzMv08ULzE29_lDsvJTSUr2BH2Flk-w2',
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

    if (!result) {
      return this.repo.save(createDto);
    } else {
      return true;
    }
  }

  async findAll(limit: number, offset: number, accountId: string) {
    const [result, total] = await this.repo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.account', 'account')
      .where(
        'notification.accountId = :accountId OR notification.accountId IS NULL',
        {
          accountId: accountId,
        },
      )

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

  async update(id: number, accountId: string, status: boolean) {
    const notifs = await this.repo.findOne({ where: { id, accountId } });
    if (!notifs) {
      throw new NotFoundException('Notification not found!');
    }
    const obj = Object.assign(notifs, { read: status });
    return this.repo.save(obj);
  }

  async notifyAdminPurchase(itemName: string, userEmail: string, amount: number) {
    await this.create({
      title: 'New Purchase',
      desc: `${userEmail} purchased ${itemName} for ₹${amount}`,
      type: 'PURCHASE',
      accountId: null
    });
  }

  async notifyAdminNewUser(userEmail: string) {
    await this.create({
      title: 'New User Registration',
      desc: `New user registered: ${userEmail}`,
      type: 'NEW_USER',
      accountId: null
    });
  }

  async notifyAdminFeedback(userEmail: string, rating: number) {
    await this.create({
      title: 'New Feedback',
      desc: `${userEmail} gave ${rating} star rating`,
      type: 'FEEDBACK',
      accountId: null
    });
  }

  async notifyUserPurchase(accountId: string, itemName: string) {
    await this.create({
      title: 'Purchase Successful',
      desc: `You have successfully purchased ${itemName}`,
      type: 'PURCHASE',
      accountId
    });
  }

  async notifyUserExpiringSoon(accountId: string, itemName: string, daysLeft: number) {
    await this.create({
      title: 'Content Expiring Soon',
      desc: `Your access to ${itemName} expires in ${daysLeft} days. Buy again to continue!`,
      type: 'EXPIRY_WARNING',
      accountId
    });
  }

  async notifyUserCoupon(accountId: string, couponCode: string) {
    await this.create({
      title: 'New Coupon Available',
      desc: `Use coupon code ${couponCode} for discount on your next purchase`,
      type: 'COUPON',
      accountId
    });
  }

  async notifySessionBooked(accountId: string, tutorName: string, sessionDate: string, startTime: string) {
    await this.create({
      title: 'Session Booked Successfully',
      desc: `Your session with ${tutorName} is confirmed for ${sessionDate} at ${startTime}`,
      type: 'SESSION_BOOKED',
      accountId
    });
  }

  async notifySessionReminder(accountId: string, tutorName: string, sessionDate: string, startTime: string, hoursUntil: number) {
    await this.create({
      title: `Session Reminder - ${hoursUntil}h`,
      desc: `Your session with ${tutorName} starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} (${sessionDate} at ${startTime})`,
      type: 'SESSION_REMINDER',
      accountId
    });
  }

  async notifyPaymentSuccess(accountId: string, itemName: string, amount: number) {
    await this.create({
      title: 'Payment Successful',
      desc: `Payment of ₹${amount} for ${itemName} completed successfully`,
      type: 'PAYMENT_SUCCESS',
      accountId
    });
  }

  async notifyPaymentFailed(accountId: string, itemName: string, amount: number) {
    await this.create({
      title: 'Payment Failed',
      desc: `Payment of ₹${amount} for ${itemName} failed. Please try again`,
      type: 'PAYMENT_FAILED',
      accountId
    });
  }

  async notifyRefundProcessed(accountId: string, amount: number, reason: string) {
    await this.create({
      title: 'Refund Processed',
      desc: `Refund of ₹${amount} has been processed for ${reason}`,
      type: 'REFUND_PROCESSED',
      accountId
    });
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
      type: 'NEW_MESSAGE',
      accountId: receiverId
    });
  }

  async notifySessionCancelled(accountId: string, tutorName: string, sessionDate: string, startTime: string, cancelledBy: string) {
    await this.create({
      title: 'Session Cancelled',
      desc: `Your session with ${tutorName} on ${sessionDate} at ${startTime} was cancelled ${cancelledBy === 'tutor' ? 'by the tutor' : ''}`,
      type: 'SESSION_CANCELLED',
      accountId
    });
  }

  async notifySessionRescheduled(accountId: string, tutorName: string, oldDate: string, oldTime: string, newDate: string, newTime: string, rescheduledBy: string) {
    await this.create({
      title: 'Session Rescheduled',
      desc: `Your session with ${tutorName} has been moved from ${oldDate} ${oldTime} to ${newDate} ${newTime} ${rescheduledBy === 'tutor' ? 'by the tutor' : ''}`,
      type: 'SESSION_RESCHEDULED',
      accountId
    });
  }


}
