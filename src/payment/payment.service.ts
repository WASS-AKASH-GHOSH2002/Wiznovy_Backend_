import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import Stripe from 'stripe';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Session } from '../session/entities/session.entity';
import { Course } from '../course/entities/course.entity';
import { PaymentStatus, PurchaseType, SessionStatus } from '../enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NodeMailerService } from '../node-mailer/node-mailer.service';
import { ZoomService } from '../zoom/zoom.service';
import { PaymentPaginationDto } from './dto/payment-pagination.dto';
import { InvoiceGenerator, InvoiceData } from '../utils/invoice-generator.utils';
import { OrderNumberGenerator } from '../utils/order-number.util';
import { SettingsService } from '../settings/settings.service';
import { writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly invoiceGenerator: InvoiceGenerator;

  constructor(
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly notificationsService: NotificationsService,
    private readonly nodeMailerService: NodeMailerService,
    private readonly zoomService: ZoomService,
    private readonly settingsService: SettingsService,
  ) {
    this.invoiceGenerator = new InvoiceGenerator();
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
      return;
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  private checkStripeAvailability() {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
  }

  async createCheckoutSession(amount: number, currency = 'usd', metadata?: any) {
    this.checkStripeAvailability();
    try {
      return await this.stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: 'Payment',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment-success`,
        cancel_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment/cancel`,
        metadata,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
    }
  }

  async createSessionPayment(sessionId: string, userId: string) {

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['tutor', 'tutor.tutorDetail']
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }


    if (session.userId !== userId) {
      throw new BadRequestException('Unauthorized to pay for this session');
    }

    const purchase = await this.purchaseRepo.findOne({
      where: { sessionId, accountId: userId }
    });

    if (!purchase) {
      throw new NotFoundException('Purchase record not found');
    }

    if (purchase.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this session');
    }


    const paymentAmount = session.amount || 10;

    const checkoutSession = await this.createCheckoutSession(
      paymentAmount,
      'usd',
      {
        sessionId: String(sessionId),
        userId: String(userId),
        purchaseId: String(purchase.id),
        tutorName: session.tutor?.tutorDetail?.[0]?.name ?? 'Tutor',
        sessionDate: String(session.sessionDate),
        startTime: String(session.startTime),
      }
    );



    purchase.amount = paymentAmount;
    purchase.stripePaymentIntentId = checkoutSession.id;
    await this.purchaseRepo.save(purchase);

    return {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: paymentAmount,
      currency: 'usd',
    };
  }

  async createCoursePayment(courseId: string, userId: string) {

    const user = await this.accountRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (!course.discountPrice || course.discountPrice <= 0) {
      throw new BadRequestException('Course price not set or invalid');
    }

    const purchase = this.purchaseRepo.create({
      accountId: userId,
      courseId,
      purchaseType: PurchaseType.COURSE,
      amount: course.discountPrice,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.PENDING
    });
    const savedPurchase = await this.purchaseRepo.save(purchase);

    const checkoutSession = await this.createCheckoutSession(
      course.discountPrice,
      'usd',
      {
        courseId,
        userId,
        purchaseId: savedPurchase.id,
        purchaseType: 'course',
        courseName: course.name,
      }
    );

    savedPurchase.stripePaymentIntentId = checkoutSession.id;
    await this.purchaseRepo.save(savedPurchase);

    return {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: course.discountPrice,
      currency: 'usd',
    };
  }



  async confirmPayment(checkoutSessionId: string) {
    this.checkStripeAvailability();
    try {

      const checkoutSession = await this.stripe.checkout.sessions.retrieve(checkoutSessionId);

      const purchase = await this.purchaseRepo.findOne({
        where: { stripePaymentIntentId: checkoutSessionId },
        relations: ['session', 'course', 'account', 'account.userDetail']
      });

      if (!purchase) {
        throw new NotFoundException('Purchase not found for this payment');
      }

      if (checkoutSession.payment_status === 'paid') {
        purchase.paymentStatus = PaymentStatus.COMPLETED;
        purchase.paidAt = new Date();
        await this.purchaseRepo.save(purchase);



        await this.handleSuccessfulPayment(purchase, null);
      } else if (checkoutSession.payment_status === 'unpaid') {
        purchase.paymentStatus = PaymentStatus.FAILED;
        await this.purchaseRepo.save(purchase);

        await this.handleFailedPayment(purchase);
      }

      return {
        status: checkoutSession.payment_status,
        purchase,
        checkoutSession
      };
    } catch (error) {
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    this.checkStripeAvailability();
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'wallet_topup') {

          break;
        }
        await this.handleCheckoutSuccess(session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'charge.dispute.created':
        await this.handleDispute(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const purchase = await this.purchaseRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (purchase && purchase.paymentStatus !== PaymentStatus.COMPLETED) {
      purchase.paymentStatus = PaymentStatus.COMPLETED;
      purchase.paidAt = new Date();
      await this.purchaseRepo.save(purchase);

      await this.handleSuccessfulPayment(purchase, paymentIntent);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const purchase = await this.purchaseRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['account', 'account.userDetail']
    });

    if (purchase) {
      purchase.paymentStatus = PaymentStatus.FAILED;
      await this.purchaseRepo.save(purchase);

      await this.handleFailedPayment(purchase);
    }
  }

  private async handleSuccessfulPayment(purchase: UserPurchase, paymentIntent: Stripe.PaymentIntent | null) {
    const user = purchase.account;
    let itemName: string;

    if (purchase.sessionId) {
      itemName = 'Session Booking';
      await this.confirmSession(purchase.sessionId);
    } else if (purchase.courseId) {
      itemName = 'Course Purchase';
      await this.sendCourseSuccessNotifications(purchase);
    } else {
      itemName = 'Purchase';
    }

    // Generate invoice after successful payment
    await this.generateInvoice(purchase);

    // Send payment success notifications
    if (user?.email) {
      await this.nodeMailerService.purchaseSuccessEmail(
        user.email,
        itemName,
        purchase.amount
      );
    }

    await this.notificationsService.notifyPaymentSuccess(
      purchase.accountId,
      itemName,
      purchase.amount
    );

    await this.notificationsService.notifyAdminPurchase(
      itemName,
      user?.email || 'Unknown',
      purchase.amount
    );
  }

  private async handleFailedPayment(purchase: UserPurchase) {

    let itemName: string;
    if (purchase.sessionId) {
      itemName = 'Session Booking';
    } else if (purchase.courseId) {
      itemName = 'Course Purchase';
    } else {
      itemName = 'Purchase';
    }

    await this.notificationsService.notifyPaymentFailed(
      purchase.accountId,
      itemName,
      purchase.amount
    );
  }

  private async handleCheckoutSuccess(session: Stripe.Checkout.Session) {
    const purchase = await this.purchaseRepo.findOne({
      where: { stripePaymentIntentId: session.id },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (purchase && purchase.paymentStatus !== PaymentStatus.COMPLETED) {
      purchase.paymentStatus = PaymentStatus.COMPLETED;
      purchase.paidAt = new Date();
      await this.purchaseRepo.save(purchase);

      await this.handleSuccessfulPayment(purchase, null);
    }
  }

  private async handleDispute(dispute: Stripe.Dispute) {

  }

  private async confirmSession(sessionId: string) {
    try {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['tutor', 'tutor.tutorDetail', 'zoomMeeting']
      });

      if (session && session.status === SessionStatus.PENDING) {
        session.status = SessionStatus.SCHEDULED;
        await this.sessionRepo.save(session);

        // Create Zoom meeting
        const zoomMeeting = await this.zoomService.createMeetingForSession(session);

        // Get user details
        const userWithDetails = await this.accountRepo.findOne({
          where: { id: session.userId },
          relations: ['userDetail']
        });

        // Get session with zoom details
        const sessionWithZoom = await this.sessionRepo.findOne({
          where: { id: sessionId },
          relations: ['zoomMeeting']
        });

        const sessionType = session.notes?.includes('trial') ? 'trial' : 'lesson';
        const sessionDate = session.sessionDate.toISOString().split('T')[0];
        const userName = userWithDetails?.userDetail?.[0]?.name || 'Student';
        const tutorName = session.tutor?.tutorDetail?.[0]?.name || 'Tutor';

        // Prepare Zoom details
        const zoomDetails = {
          joinUrl: sessionWithZoom?.zoomMeeting?.joinUrl,
          startUrl: sessionWithZoom?.zoomMeeting?.startUrl,
          meetingId: sessionWithZoom?.zoomMeeting?.meetingId,
          passcode: sessionWithZoom?.zoomMeeting?.password
        };

        // Send comprehensive emails with all details
        if (userWithDetails?.email) {
          await this.nodeMailerService.sendUserSessionConfirmation(
            userWithDetails.email,
            userName,
            tutorName,
            sessionDate,
            session.startTime,
            session.endTime,
            {
              joinUrl: zoomDetails.joinUrl,
              meetingId: zoomDetails.meetingId,
              passcode: zoomDetails.passcode
            }
          );
        }

        if (session.tutor?.email) {
          await this.nodeMailerService.sendTutorSessionConfirmation(
            session.tutor.email,
            tutorName,
            userName,
            sessionDate,
            session.startTime,
            session.endTime,
            {
              startUrl: zoomDetails.startUrl,
              meetingId: zoomDetails.meetingId,
              passcode: zoomDetails.passcode
            }
          );
        }

        // Send in-app notifications to both user and tutor
        await this.notificationsService.notifySessionBooked(
          session.userId,
          tutorName,
          sessionDate,
          session.startTime
        );

        await this.notificationsService.notifySessionBooked(
          session.tutorId,
          userName,
          sessionDate,
          session.startTime
        );

        // Send Zoom meeting details notification
        if (sessionWithZoom?.zoomMeeting) {
          await this.notificationsService.create({
            title: 'Zoom Meeting Ready',
            desc: `Your session is confirmed! Meeting ID: ${sessionWithZoom.zoomMeeting.meetingId}. Join 5 minutes early.`,
            type: 'ZOOM_MEETING',
            accountId: session.userId
          });

          await this.notificationsService.create({
            title: 'Zoom Meeting Ready',
            desc: `Session with ${userName} confirmed! Meeting ID: ${sessionWithZoom.zoomMeeting.meetingId}. Start 10 minutes early.`,
            type: 'ZOOM_MEETING',
            accountId: session.tutorId
          });
        }
      }
    } catch (error) {
      console.error('Failed to confirm session:', error);
    }
  }

  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    this.checkStripeAvailability();
    try {
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

      const charges = await this.stripe.charges.list({
        payment_intent: paymentIntentId,
        limit: 1
      });

      if (!charges.data[0]) {
        throw new BadRequestException('No charge found for this payment');
      }

      const refund = await this.stripe.refunds.create({
        charge: charges.data[0].id,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          original_payment_intent: paymentIntentId,
        }
      });


      const purchase = await this.purchaseRepo.findOne({
        where: { stripePaymentIntentId: paymentIntentId }
      });

      if (purchase) {
        purchase.paymentStatus = PaymentStatus.REFUNDED;
        await this.purchaseRepo.save(purchase);

        await this.notificationsService.notifyRefundProcessed(
          purchase.accountId,
          refund.amount / 100,
          reason || 'Refund processed'
        );
      }

      return refund;
    } catch (error) {
      throw new BadRequestException(`Failed to create refund: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string, dto: PaymentPaginationDto) {
    const queryBuilder = this.purchaseRepo.createQueryBuilder('purchase')
      .select([
        'purchase.id',
        'purchase.amount',
        'purchase.paymentStatus',
        'purchase.purchaseType',
        'purchase.createdAt',
        'purchase.paidAt',
        'purchase.sessionId',
        'purchase.courseId',
        'session.id',
        'course.id',
        'course.name'
      ])
      .leftJoin('purchase.session', 'session')
      .leftJoin('purchase.course', 'course')
      .where('purchase.accountId = :userId', { userId });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('purchase.stripePaymentIntentId LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('course.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.date) {
      queryBuilder.andWhere('DATE(purchase.createdAt) = :date', { date: dto.date });
    }

    const [result, total] = await queryBuilder
      .orderBy('purchase.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async getAllPaymentHistory(dto: PaymentPaginationDto) {
    const queryBuilder = this.purchaseRepo.createQueryBuilder('purchase')

      .leftJoin('purchase.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('purchase.session', 'session')
      .leftJoin('purchase.course', 'course')
      .select([
        'purchase.id',
        'purchase.amount',
        'purchase.paymentStatus',
        'purchase.purchaseType',
        'purchase.createdAt',
        'purchase.paidAt',
        'purchase.accountId',
        'account.email',
        'account.phoneNumber',
        'userDetail.name',
        'session.sessionDate',
        'session.startTime',
        'course.name'
      ])


    if (dto.paymentStatus) {
      queryBuilder.andWhere('purchase.paymentStatus = :status', { status: dto.paymentStatus });
    }

    if (dto.purchaseType) {
      queryBuilder.andWhere('purchase.purchaseType = :type', { type: dto.purchaseType });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('userDetail.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('account.email LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('course.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.date) {
      queryBuilder.andWhere('DATE(purchase.createdAt) = :date', { date: dto.date });
    }

    const [result, total] = await queryBuilder
      .orderBy('purchase.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async getPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return paymentMethods.data;
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  async getPurchaseById(purchaseId: string) {
    const purchase = await this.purchaseRepo.createQueryBuilder('purchase')
      .leftJoin('purchase.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('purchase.session', 'session')
      .leftJoin('purchase.course', 'course')
      .select([
        'purchase.id',
        'purchase.amount',
        'purchase.paymentStatus',
        'purchase.purchaseType',
        'purchase.createdAt',
        'purchase.paidAt',
        'purchase.accountId',
        'account.email',
        'account.phoneNumber',
        'userDetail.name',
        'session.sessionDate',
        'session.startTime',
        'course.name'
      ])
      .where('purchase.id = :purchaseId', { purchaseId })
      .getOne();

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  async testConfirmPayment(purchaseId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    if (purchase.paymentStatus === PaymentStatus.COMPLETED) {
      return { message: 'Payment already completed', purchase };
    }

    purchase.paymentStatus = PaymentStatus.COMPLETED;
    purchase.paidAt = new Date();
    await this.purchaseRepo.save(purchase);

    await this.handleSuccessfulPayment(purchase, null);

    return { message: 'Payment confirmed successfully', purchase };
  }

  private async generateInvoice(purchase: UserPurchase): Promise<string> {
    try {
      
      const purchaseWithDetails = await this.purchaseRepo.findOne({
        where: { id: purchase.id },
        relations: ['account', 'account.userDetail', 'session', 'course']
      });

      if (!purchaseWithDetails) {
        throw new Error('Purchase not found');
      }

      const settings = await this.settingsService.getSettings();

      
      let customerName = 'Customer';
      if (purchaseWithDetails.account?.userDetail) {
        if (Array.isArray(purchaseWithDetails.account.userDetail)) {
          customerName = purchaseWithDetails.account.userDetail[0]?.name || 'Customer';
        } else {
          customerName = (purchaseWithDetails.account.userDetail as any).name || 'Customer';
        }
      }

      const invoiceData: InvoiceData = {
        orderNumber: purchaseWithDetails.orderNumber || purchaseWithDetails.id,
        orderDate: this.invoiceGenerator.formatDate(purchaseWithDetails.createdAt),
        customerName: customerName,
        customerEmail: purchaseWithDetails.account?.email || '',
        items: await this.getInvoiceItems(purchaseWithDetails),
        subtotal: purchaseWithDetails.amount,
        tax: parseFloat((purchaseWithDetails.amount * 0.1).toFixed(2)),
        total: parseFloat((purchaseWithDetails.amount * 1.1).toFixed(2)),
        paymentStatus: purchaseWithDetails.paymentStatus,
        transactionId: purchaseWithDetails.stripePaymentIntentId || 'N/A',
        companyName: settings?.companyName || 'N/A',
        companyAddress: settings?.companyAddress || 'N/A',
        companyEmail: settings?.email || 'N/A',
        companyPhone: settings?.companyPhone || 'N/A'
      };

      const pdfBuffer = await this.invoiceGenerator.generateInvoicePDF(invoiceData);

      // Save invoice to uploads folder using purchase ID
      const fileName = `invoice-${purchaseWithDetails.id}.pdf`;
      const filePath = join(process.cwd(), 'uploads', 'invoices', fileName);

      // Create directory if it doesn't exist
      const fs = require('fs');
      const dir = join(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      writeFileSync(filePath, new Uint8Array(pdfBuffer));

      return fileName;
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      return null;
    }
  }

  private async getInvoiceItems(purchase: UserPurchase) {
    const items = [];

    if (purchase.sessionId && purchase.session) {
      items.push({
        description: `Session Booking - ${purchase.session.sessionDate}`,
        quantity: 1,
        unitPrice: purchase.amount,
        total: purchase.amount
      });
    } else if (purchase.courseId && purchase.course) {
      items.push({
        description: `Course Purchase - ${purchase.course.name}`,
        quantity: 1,
        unitPrice: purchase.amount,
        total: purchase.amount
      });
    } else {
      items.push({
        description: 'Service Purchase',
        quantity: 1,
        unitPrice: purchase.amount,
        total: purchase.amount
      });
    }

    return items;
  }

  async downloadInvoice(purchaseId: string, userId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId, accountId: userId },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Invoice only available for completed payments');
    }

    const fileName = await this.generateInvoice(purchase);
    const filePath = join(process.cwd(), 'uploads', 'invoices', fileName);

    return { filePath, fileName };
  }

  async downloadInvoiceAdmin(purchaseId: string) {
    const purchase = await this.purchaseRepo.findOne({
      where: { id: purchaseId },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Invoice only available for completed payments');
    }

    const fileName = await this.generateInvoice(purchase);
    const filePath = join(process.cwd(), 'uploads', 'invoices', fileName);

    return { filePath, fileName };
  }

  private async sendCourseSuccessNotifications(purchase: UserPurchase) {
    try {
      const course = await this.courseRepo.findOne({
        where: { id: purchase.courseId },
        relations: ['tutor', 'tutor.tutorDetail']
      });

      const user = await this.accountRepo.findOne({
        where: { id: purchase.accountId },
        relations: ['userDetail']
      });

      if (course && user) {
        const userName = user.userDetail?.[0]?.name || 'Student';
        const tutorName = course.tutor?.tutorDetail?.[0]?.name || 'Tutor';

        // Notify tutor about course purchase
        if (course.tutor?.email) {
          await this.nodeMailerService.sendCourseEnrollmentNotification(
            course.tutor.email,
            tutorName,
            userName,
            course.name,
            purchase.amount
          );
        }

        // Send notifications
        await this.notificationsService.create({
          title: 'Course Purchased Successfully',
          desc: `You have successfully enrolled in ${course.name}`,
          type: 'COURSE_PURCHASE',
          accountId: purchase.accountId
        });

        if (course.tutorId) {
          await this.notificationsService.create({
            title: 'New Course Enrollment',
            desc: `${userName} has enrolled in your course: ${course.name}`,
            type: 'COURSE_ENROLLMENT',
            accountId: course.tutorId
          });
        }
      }
    } catch (error) {
      console.error('Failed to send course notifications:', error);
    }
  }
}