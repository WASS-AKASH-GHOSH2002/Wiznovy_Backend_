
import { Injectable, BadRequestException, NotFoundException, HttpStatus, Logger } from '@nestjs/common';
import { CustomException } from '../shared/exceptions/custom.exception';
import { MESSAGE_CODES } from '../shared/constants/message-codes';
import { MessageType } from '../shared/constants/message-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import Stripe from 'stripe';
import { Payment } from './entities/payment.entity';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Session } from '../session/entities/session.entity';
import { Course } from '../course/entities/course.entity';
import { PaymentMethod, PaymentStatus, PurchaseType, SessionStatus, SessionType, NotificationType } from '../enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NodeMailerService } from '../node-mailer/node-mailer.service';
import { ZoomService } from '../zoom/zoom.service';
import { PaymentPaginationDto } from './dto/payment-pagination.dto';
import { InvoiceGenerator, InvoiceData } from '../utils/invoice-generator.utils';
import { OrderNumberGenerator } from '../utils/order-number.util';
import { SettingsService } from '../settings/settings.service';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WalletService } from '../wallet/wallet.service';
import { buildCsv, formatCsvDate, CsvColumn } from '../utils/csv.utils';


@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly invoiceGenerator: InvoiceGenerator;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
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
    private readonly walletService: WalletService,
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
      throw new CustomException(MESSAGE_CODES.PAYMENT_FAILED, MessageType.ERROR, HttpStatus.BAD_REQUEST);
    }
  }

  async createSessionPayment(sessionId: string, userId: string, paymentMethod: PaymentMethod) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['tutor', 'tutor.tutorDetail']
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Unauthorized to pay for this session');
    if (session.status !== SessionStatus.PENDING) throw new BadRequestException('Session is not in pending status');

    const existingPurchase = await this.paymentRepo.findOne({
      where: { sessionId, accountId: userId, paymentStatus: PaymentStatus.COMPLETED }
    });
    if (existingPurchase) throw new CustomException(MESSAGE_CODES.PAYMENT_DUPLICATE, MessageType.ERROR, HttpStatus.CONFLICT);

    const paymentAmount = session.amount;

    if (paymentMethod === PaymentMethod.WALLET) {
      return this.processWalletSessionPayment(session, userId, paymentAmount);
    }

    return this.processStripeSessionPayment(session, userId, paymentAmount);
  }

  private async processWalletSessionPayment(session: Session, userId: string, amount: number) {
    await this.walletService.purchaseSession(userId, amount, session.id);

    const payment = this.paymentRepo.create({
      accountId: userId,
      sessionId: session.id,
      purchaseType: PurchaseType.SESSION,
      amount,
      originalAmount: amount,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.WALLET,
      transactionId: OrderNumberGenerator.generateTransactionId('WALLET'),
      paidAt: new Date(),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    session.purchaseId = savedPayment.id;
    await this.sessionRepo.save(session);

    const paymentWithRelations = await this.paymentRepo.findOne({
      where: { id: savedPayment.id },
      relations: ['account', 'account.userDetail'],
    });
    await this.handleSuccessfulPayment(paymentWithRelations, null);

    return {
      message: 'Session purchased with wallet successfully',
      paymentMethod: PaymentMethod.WALLET,
      amount,
      purchaseId: savedPayment.id,
    };
  }

  private async processStripeSessionPayment(session: Session, userId: string, amount: number) {
    this.checkStripeAvailability();

    const payment = this.paymentRepo.create({
      accountId: userId,
      sessionId: session.id,
      purchaseType: PurchaseType.SESSION,
      amount,
      originalAmount: amount,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.STRIPE,
      transactionId: OrderNumberGenerator.generateTransactionId('STRIPE'),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const checkoutSession = await this.createCheckoutSession(amount, 'usd', {
      sessionId: String(session.id),
      userId: String(userId),
      purchaseId: String(savedPayment.id),
      tutorName: session.tutor?.tutorDetail?.[0]?.name ?? 'Tutor',
      sessionDate: String(session.sessionDate),
      startTime: String(session.startTime),
    });

    savedPayment.stripePaymentIntentId = checkoutSession.id;
    await this.paymentRepo.save(savedPayment);

    await this.sendPendingPaymentEmail(savedPayment, 'Session Booking');

    return {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount,
      currency: 'usd',
      paymentMethod: PaymentMethod.STRIPE,
      purchaseId: savedPayment.id,
    };
  }





  async createCoursePayment(courseId: string, userId: string, paymentMethod: PaymentMethod) {
    const user = await this.accountRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.discountPrice || course.discountPrice <= 0) throw new BadRequestException('Course price not set or invalid');

    const existingPurchase = await this.purchaseRepo.findOne({
      where: { accountId: userId, courseId, paymentStatus: PaymentStatus.COMPLETED },
      order: { paidAt: 'DESC' }
    });
    if (existingPurchase?.expiresAt && existingPurchase.expiresAt > new Date()) {
      throw new CustomException(MESSAGE_CODES.PAYMENT_DUPLICATE, MessageType.ERROR, HttpStatus.CONFLICT);
    }

    if (paymentMethod === PaymentMethod.WALLET) {
      return this.processCourseWalletPayment(course, userId);
    }
    return this.processCourseStripePayment(course, userId);
  }

  private async processCourseWalletPayment(course: Course, userId: string) {
    await this.walletService.purchaseCourse(userId, course.discountPrice, course.id);

    const purchase = this.purchaseRepo.create({
      accountId: userId,
      courseId: course.id,
      amount: course.discountPrice,
      originalAmount: course.discountPrice,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.WALLET,
      transactionId: OrderNumberGenerator.generateTransactionId('WALLET'),
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + course.validityDays * 24 * 60 * 60 * 1000),
    });
    const savedPurchase = await this.purchaseRepo.save(purchase);

    const payment = this.paymentRepo.create({
      accountId: userId,
      courseId: course.id,
      purchaseType: PurchaseType.COURSE,
      amount: course.discountPrice,
      originalAmount: course.discountPrice,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.WALLET,
      transactionId: savedPurchase.transactionId,
      paidAt: new Date(),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const paymentWithRelations = await this.paymentRepo.findOne({
      where: { id: savedPayment.id },
      relations: ['account', 'account.userDetail', 'course', 'course.tutor', 'course.tutor.tutorDetail'],
    });

    await this.handleSuccessfulPayment(paymentWithRelations, null);

    return {
      message: 'Course purchased with wallet successfully',
      paymentMethod: PaymentMethod.WALLET,
      amount: course.discountPrice,
      expiresAt: savedPurchase.expiresAt,
      purchaseId: savedPurchase.id,
    };
  }

  private async processCourseStripePayment(course: Course, userId: string) {
    this.checkStripeAvailability();

    const purchase = this.purchaseRepo.create({
      accountId: userId,
      courseId: course.id,
      amount: course.discountPrice,
      originalAmount: course.discountPrice,
      orderNumber: OrderNumberGenerator.generateOrderNumber(),
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.STRIPE,
      transactionId: OrderNumberGenerator.generateTransactionId('STRIPE'),
    });
    const savedPurchase = await this.purchaseRepo.save(purchase);

    const checkoutSession = await this.createCheckoutSession(course.discountPrice, 'usd', {
      courseId: course.id,
      userId,
      purchaseId: savedPurchase.id,
      purchaseType: 'course',
      courseName: course.name,
      validityDays: course.validityDays.toString(),
    });

    savedPurchase.transactionId = checkoutSession.id;
    await this.purchaseRepo.save(savedPurchase);

    await this.sendPendingPaymentEmail(savedPurchase as any, 'Course Payment');

    return {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: course.discountPrice,
      currency: 'usd',
      paymentMethod: PaymentMethod.STRIPE,
      purchaseId: savedPurchase.id,
    };
  }

  private async sendCourseSuccessNotificationsById(courseId: string, userId: string, amount: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['tutor', 'tutor.tutorDetail'] });
    const user = await this.accountRepo.findOne({ where: { id: userId }, relations: ['userDetail'] });
    if (!course || !user) return;

    const userName = user.userDetail?.[0]?.name || 'Student';
    const tutorName = course.tutor?.tutorDetail?.[0]?.name || 'Tutor';
    const courseLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/my-learnings/${course.id}` : `https://wiznovy.com/my-learnings/${course.id}`;
    const dashboardLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/courses/${course.id}` : `https://wiznovy.com/dashboard/courses/${course.id}`;
    const enrollmentCount = await this.purchaseRepo.count({ where: { courseId: course.id, paymentStatus: PaymentStatus.COMPLETED } });

    if (user.email) {
      await this.nodeMailerService.sendCourseEnrollmentConfirmation({
        email: user.email,
        studentName: userName,
        courseName: course.name,
        tutorName,
        amount,
        courseLink,
      });
    }

    if (course.tutor?.email) {
      await this.nodeMailerService.sendTutorCourseEnrollmentNotification({
        email: course.tutor.email,
        tutorName,
        studentName: userName,
        courseName: course.name,
        enrollmentCount,
        dashboardLink,
      });
    }
    await this.notificationsService.create({ title: 'Course Purchased Successfully', desc: `You have successfully enrolled in ${course.name}`, type: NotificationType.COURSE_PURCHASE, accountId: userId });
    if (course.tutorId) {
      await this.notificationsService.create({ title: 'New Course Enrollment', desc: `${userName} has enrolled in your course: ${course.name}`, type: NotificationType.COURSE_ENROLLMENT, accountId: course.tutorId });
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
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (payment && payment.paymentStatus !== PaymentStatus.COMPLETED) {
      payment.paymentStatus = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      await this.paymentRepo.save(payment);

      await this.handleSuccessfulPayment(payment, paymentIntent);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      relations: ['account', 'account.userDetail']
    });

    if (payment) {
      payment.paymentStatus = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);

      await this.handleFailedPayment(payment);
    }
  }

  private async handleSuccessfulPayment(payment: Payment, paymentIntent: Stripe.PaymentIntent | null) {
    const user = payment.account;
    let itemName: string;

    if (payment.sessionId) {
      itemName = 'Session Booking';
      await this.confirmSession(payment.sessionId);
      await this.queueTutorEarningForSession(payment);
    } else if (payment.courseId) {
      itemName = 'Course payment';
      await this.sendCourseSuccessNotifications(payment);
      await this.queueTutorEarningForCourse(payment);
    } else {
      itemName = 'payment';
    }

    const invoiceResult = await this.generateInvoice(payment);

    if (user?.email) {
      const studentName = user.userDetail?.[0]?.name || user.userDetail?.['name'] || 'Student';
      const transactionId = payment.transactionId || payment.stripePaymentIntentId || 'N/A';
      const date = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      await this.nodeMailerService.purchaseSuccessEmail(
        user.email,
        studentName,
        itemName,
        payment.amount,
        transactionId,
        date,
        invoiceResult?.buffer,
      );
    }

    await this.notificationsService.notifyPaymentSuccess(
      payment.accountId,
      itemName,
      payment.amount,
      payment.transactionId || payment.stripePaymentIntentId,
    );
  }

  private async handleFailedPayment(payment: Payment) {
    let itemName: string;
    if (payment.sessionId) {
      itemName = 'Session Booking';
    } else if (payment.courseId) {
      itemName = 'Course payment';
    } else {
      itemName = 'payment';
    }

    if (payment.account?.email) {
      const studentName = payment.account.userDetail?.[0]?.name || payment.account.userDetail?.['name'] || 'Student';
      const invoiceResult = await this.generateInvoice(payment);
      await this.nodeMailerService.sendPaymentFailedEmail(
        payment.account.email,
        studentName,
        payment.amount,
        'Payment could not be processed. Please check your payment details and try again.',
        invoiceResult?.buffer,
      );
    }

    await this.notificationsService.notifyPaymentFailed(
      payment.accountId,
      itemName,
      payment.amount
    );
  }

  private async sendPendingPaymentEmail(payment: Payment, itemName: string) {
    try {
      const account = await this.accountRepo.findOne({
        where: { id: payment.accountId },
        relations: ['userDetail'],
      });
      if (!account?.email) return;
      const studentName = account.userDetail?.[0]?.name || 'Student';
      const invoiceResult = await this.generateInvoice(payment);
      await this.nodeMailerService.sendPaymentPendingEmail(
        account.email,
        studentName,
        itemName,
        payment.amount,
        payment.transactionId || 'N/A',
        invoiceResult?.buffer,
      );
    } catch (error) {
      this.logger.warn('Failed to send pending payment email:', error?.message);
    }
  }

  private async handleCheckoutSuccess(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: session.id },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (payment && payment.paymentStatus !== PaymentStatus.COMPLETED) {
      payment.paymentStatus = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      
      // Set expiry date for course purchases
      if (payment.courseId && session.metadata?.validityDays) {
        const validityDays = parseInt(session.metadata.validityDays);
        payment.expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
      }
      
      await this.paymentRepo.save(payment);

      await this.handleSuccessfulPayment(payment, null);
    }
  }

  private async handleDispute(dispute: Stripe.Dispute) {

  }

  private async confirmSession(sessionId: string) {
    try {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['tutor', 'tutor.tutorDetail', 'tutor.tutorDetail.subject', 'zoomMeeting']
      });

      if (!session) return;

      if (session.status === SessionStatus.PENDING) {
        session.status = SessionStatus.SCHEDULED;
        await this.sessionRepo.save(session);
      }

      await this.zoomService.createMeetingForSession(session);

      const userWithDetails = await this.accountRepo.findOne({
        where: { id: session.userId },
        relations: ['userDetail']
      });

      const sessionWithZoom = await this.sessionRepo.findOne({
        where: { id: sessionId },
        relations: ['zoomMeeting']
      });

      const sessionDate = session.sessionDate;
      const userName = userWithDetails?.userDetail?.[0]?.name || 'Student';
      const tutorName = session.tutor?.tutorDetail?.[0]?.name || 'Tutor';
      const subjectName = session.tutor?.tutorDetail?.[0]?.subject?.name || 'General';
      const dashboardLink = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : 'https://wiznovy.com/dashboard';
      const timezone = process.env.APP_TIMEZONE || 'UTC';

      const zoomDetails = {
        joinUrl: sessionWithZoom?.zoomMeeting?.joinUrl,
        meetingId: sessionWithZoom?.zoomMeeting?.meetingId,
        passcode: sessionWithZoom?.zoomMeeting?.password,
      };

      if (userWithDetails?.email) {
        await this.nodeMailerService.sendUserSessionConfirmation(
          userWithDetails.email, userName, tutorName, sessionDate,
          session.startTime, session.endTime, zoomDetails
        );
        if (session.sessionType === SessionType.TRIAL) {
          await this.nodeMailerService.sendTrialSessionConfirmation({
            email: userWithDetails.email, studentName: userName, tutorName,
            subject: subjectName, date: sessionDate,
            time: `${session.startTime} - ${session.endTime}`, timezone, amount: session.amount,
          });
        }
      }

      if (session.tutor?.email) {
        await this.nodeMailerService.sendSessionBookingNotification({
          email: session.tutor.email, recipientName: tutorName, tutorName,
          studentName: userName, subject: subjectName, date: sessionDate,
          time: `${session.startTime} - ${session.endTime}`, timezone,
          duration: session.duration, dashboardLink,
        });
        if (session.sessionType === SessionType.TRIAL) {
          await this.nodeMailerService.sendTutorTrialSessionNotification({
            email: session.tutor.email, tutorName, studentName: userName,
            subject: subjectName, date: sessionDate,
            time: `${session.startTime} - ${session.endTime}`, timezone,
          });
        }
      }

      await this.notificationsService.notifySessionBooked(session.userId, tutorName, sessionDate, session.startTime);
      await this.notificationsService.notifyTutorNewBooking(session.tutorId, userName, subjectName, sessionDate as string, session.startTime);

      if (sessionWithZoom?.zoomMeeting) {
        await this.notificationsService.create({
          title: 'Zoom Meeting Ready',
          desc: `Your session is confirmed! Meeting ID: ${sessionWithZoom.zoomMeeting.meetingId}. Join 5 minutes early.`,
          type: NotificationType.ZOOM_MEETING, accountId: session.userId,
        });
        await this.notificationsService.create({
          title: 'Zoom Meeting Ready',
          desc: `Session with ${userName} confirmed! Meeting ID: ${sessionWithZoom.zoomMeeting.meetingId}. Start 10 minutes early.`,
          type: NotificationType.ZOOM_MEETING, accountId: session.tutorId,
        });
      }
    } catch (error) {
      console.error('confirmSession error:', error.message);
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


      const payment = await this.paymentRepo.findOne({
        where: { stripePaymentIntentId: paymentIntentId }
      });

      if (payment) {
        payment.paymentStatus = PaymentStatus.REFUNDED;
        await this.paymentRepo.save(payment);

        await this.notificationsService.notifyRefundProcessed(
          payment.accountId,
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
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.amount',
        'payment.paymentStatus',
        'payment.purchaseType',
        'payment.createdAt',
        'payment.paidAt',
        'payment.sessionId',
        'payment.courseId',
        'session.id',
        'course.id',
        'course.name'
      ])
      .leftJoin('payment.session', 'session')
      .leftJoin('payment.course', 'course')
      .where('payment.accountId = :userId', { userId });

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('payment.stripePaymentIntentId LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('course.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.date) {
      queryBuilder.andWhere('DATE(payment.createdAt) = :date', { date: dto.date });
    }

    const [result, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(dto.offset || 0)
      .take(dto.limit || 10)
      .getManyAndCount();

    return { result, total };
  }

  async getAllPaymentHistory(dto: PaymentPaginationDto) {
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment')

      .leftJoin('payment.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('account.tutorDetail','tutorDetail')
      .leftJoin('payment.session', 'session')
      .leftJoin('payment.course', 'course')
      .select([
        'payment.id',
        'payment.amount',
        'payment.paymentStatus',
        'payment.purchaseType',
        'payment.paymentMethod',
        'payment.createdAt',
        'payment.paidAt',
        'payment.accountId',
        'account.email',
        'account.phoneNumber',
        'userDetail.name',
        'userDetail.userId',
        'tutorDetail.name',
        'session.sessionDate',
        'session.startTime',
        'course.name'
      ])


    if (dto.paymentStatus) {
      queryBuilder.andWhere('payment.paymentStatus = :status', { status: dto.paymentStatus });
    }

    if (dto.purchaseType) {
      queryBuilder.andWhere('payment.purchaseType = :type', { type: dto.purchaseType });
    }

    if (dto.accountId) {
      queryBuilder.andWhere('payment.accountId = :accountId', { accountId: dto.accountId });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('userDetail.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('userDetail.userId LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('account.email LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('payment.transactionId LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('payment.orderNumber LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('course.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    if (dto.transactionId) {
      queryBuilder.andWhere('payment.transactionId = :transactionId', { transactionId: dto.transactionId });
    }

    if (dto.userId) {
      queryBuilder.andWhere('userDetail.userId LIKE :userId', { userId: `%${dto.userId}%` });
    }

    if (dto.date) {
      queryBuilder.andWhere('DATE(payment.createdAt) = :date', { date: dto.date });
    } else {
      if (dto.fromDate && dto.toDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
      } else if (dto.fromDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) >= :fromDate', { fromDate: dto.fromDate });
      } else if (dto.toDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) <= :toDate', { toDate: dto.toDate });
      }
    }

    const [result, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async exportPaymentsCsv(dto: PaymentPaginationDto): Promise<string> {
    const queryBuilder = this.paymentRepo.createQueryBuilder('payment')
      .leftJoin('payment.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('payment.session', 'session')
      .leftJoin('session.tutor', 'tutorAccount')
      .leftJoin('tutorAccount.tutorDetail', 'tutorDetail')
      .select([
        'payment.id',
        'payment.amount',
        'payment.paymentStatus',
        'payment.purchaseType',
        'payment.paymentMethod',
        'payment.createdAt',
        'account.email',
        'userDetail.name',
        'userDetail.userId',
        'tutorDetail.name',
        'tutorDetail.tutorId',
      ]);

    if (dto.paymentStatus) {
      queryBuilder.andWhere('payment.paymentStatus = :status', { status: dto.paymentStatus });
    }
    if (dto.purchaseType) {
      queryBuilder.andWhere('payment.purchaseType = :type', { type: dto.purchaseType });
    }
    if (dto.accountId) {
      queryBuilder.andWhere('payment.accountId = :accountId', { accountId: dto.accountId });
    }
    if (dto.date) {
      queryBuilder.andWhere('DATE(payment.createdAt) = :date', { date: dto.date });
    } else {
      if (dto.fromDate && dto.toDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) BETWEEN :fromDate AND :toDate', { fromDate: dto.fromDate, toDate: dto.toDate });
      } else if (dto.fromDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) >= :fromDate', { fromDate: dto.fromDate });
      } else if (dto.toDate) {
        queryBuilder.andWhere('DATE(payment.createdAt) <= :toDate', { toDate: dto.toDate });
      }
    }

    const records = await queryBuilder.orderBy('payment.createdAt', 'DESC').getMany();

    const getTutorDetail = (p: any) => { const td = p.session?.tutor?.tutorDetail; return Array.isArray(td) ? td[0] : td; };
    const getUserDetail = (p: any) => { const ud = p.account?.userDetail; return Array.isArray(ud) ? ud[0] : ud; };

    const columns: CsvColumn[] = [
      { header: 'Student ID',       value: (p) => getUserDetail(p)?.userId ?? '' },
      { header: 'Student Name',     value: (p) => getUserDetail(p)?.name ?? '' },
      { header: 'Student Email',    value: (p) => p.account?.email ?? '' },
      { header: 'Type',             value: (p) => p.purchaseType },
      { header: 'Amount',           value: (p) => p.amount },
      { header: 'Status',           value: (p) => p.paymentStatus },
      { header: 'Payment Method',   value: (p) => p.paymentMethod ?? '' },
      { header: 'Transaction Date', value: (p) => formatCsvDate(p.createdAt) },
      { header: 'Tutor Name',       value: (p) => getTutorDetail(p)?.name ?? '' },
      { header: 'Tutor ID',         value: (p) => getTutorDetail(p)?.tutorId ?? '' },
    ];

    return buildCsv(columns, records);
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
    const payment = await this.paymentRepo.createQueryBuilder('payment')
      .leftJoin('payment.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('payment.session', 'session')
      .leftJoin('payment.course', 'course')
      .select([
        'payment.id',
        'payment.amount',
        'payment.paymentStatus',
        'payment.purchaseType',
        'payment.createdAt',
        'payment.paidAt',
        'payment.accountId',
        'account.email',
        'account.phoneNumber',
        'userDetail.name',
        'session.sessionDate',
        'session.startTime',
        'course.name'
      ])
      .where('payment.id = :purchaseId', { purchaseId })
      .getOne();

    if (!payment) {
      throw new NotFoundException('payment not found');
    }

    return payment;
  }

  async testConfirmPayment(purchaseId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: purchaseId },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (!payment) {
      throw new BadRequestException('payment not found');
    }

    if (payment.paymentStatus === PaymentStatus.COMPLETED) {
      return { message: 'Payment already completed', payment };
    }

    payment.paymentStatus = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    await this.paymentRepo.save(payment);

    await this.handleSuccessfulPayment(payment, null);

    return { message: 'Payment confirmed successfully', payment };
  }

  private async generateInvoice(payment: Payment): Promise<{ fileName: string; buffer: Buffer }> {
    try {
      const purchaseWithDetails = await this.paymentRepo.findOne({
        where: { id: payment.id },
        relations: ['account', 'account.userDetail', 'session', 'session.tutor', 'session.tutor.tutorDetail', 'session.tutor.tutorDetail.subject', 'course', 'course.tutor', 'course.tutor.tutorDetail']
      });

      if (!purchaseWithDetails) throw new Error('payment not found');

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
        customerName,
        customerEmail: purchaseWithDetails.account?.email || '',
        items: await this.getInvoiceItems(purchaseWithDetails),
        subtotal: purchaseWithDetails.amount,
        tax: Number.parseFloat((purchaseWithDetails.amount * 0.1).toFixed(2)),
        total: Number.parseFloat((purchaseWithDetails.amount * 1.1).toFixed(2)),
        paymentStatus: purchaseWithDetails.paymentStatus,
        transactionId: purchaseWithDetails.transactionId || purchaseWithDetails.stripePaymentIntentId || 'N/A',
        companyName: settings?.companyName || 'N/A',
        companyAddress: settings?.companyAddress || 'N/A',
        companyEmail: settings?.email || 'N/A',
        companyPhone: settings?.companyPhone || 'N/A',
        logoUrl: settings?.logoPath ? require('node:path').join(process.cwd(), settings.logoPath) : undefined,
      };

      const buffer = await this.invoiceGenerator.generateInvoicePDF(invoiceData);

      const fileName = `invoice-${purchaseWithDetails.id}.pdf`;
      const filePath = join(process.cwd(), 'uploads', 'invoices', fileName);

      const fs = require('node:fs');
      const dir = join(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      writeFileSync(filePath, new Uint8Array(buffer));

      return { fileName, buffer };
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      return null;
    }
  }

  private async getInvoiceItems(payment: Payment) {
    const items = [];

    if (payment.sessionId && payment.session) {
      const session = payment.session as any;
      const tutorName = session.tutor?.tutorDetail?.[0]?.name || 'Tutor';
      const subjectName = session.tutor?.tutorDetail?.[0]?.subject?.name || 'Session';
      const sessionDate = new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const sessionType = session.sessionType === 'TRIAL' ? 'Trial' : 'Regular';
      items.push({
        description: `Session: ${subjectName} Tutoring\nTutor: ${tutorName}\nDate: ${sessionDate}  Time: ${session.startTime} - ${session.endTime}\nDuration: ${session.duration} min  Type: ${sessionType}`,
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount,
      });
    } else if (payment.courseId && payment.course) {
      const course = payment.course as any;
      const instructorName = course.tutor?.tutorDetail?.[0]?.name || 'Instructor';
      const enrolledDate = payment.paidAt
        ? new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      items.push({
        description: `Course: ${course.name}\nInstructor: ${instructorName}\nAccess Type: Paid  Duration: ${course.totalLectures || 0} lectures, ${course.totalDuration || '0 hours'}\nEnrolled: ${enrolledDate}`,
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount,
      });
    } else {
      items.push({
        description: 'Service payment',
        quantity: 1,
        unitPrice: payment.amount,
        total: payment.amount
      });
    }

    return items;
  }

  async downloadInvoice(purchaseId: string, userId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: purchaseId, accountId: userId },
      relations: ['session', 'course', 'account', 'account.userDetail']
    });

    if (!payment) {
      throw new NotFoundException('payment not found');
    }

    // if (payment.paymentStatus !== PaymentStatus.COMPLETED) {
    //   throw new BadRequestException('Invoice only available for completed payments');
    // }

    const fileName = await this.generateInvoice(payment);
    const filePath = join(process.cwd(), 'uploads', 'invoices', fileName.fileName);

    return { filePath, fileName: fileName.fileName };
  }

  async downloadInvoiceAdmin(purchaseId: string) {
    return this.resolveInvoiceByType(purchaseId);
  }

  async downloadCourseInvoiceAdmin(purchaseId: string) {
    return this.resolveInvoiceByType(purchaseId, PurchaseType.COURSE);
  }

  async downloadSessionInvoiceAdmin(purchaseId: string) {
    return this.resolveInvoiceByType(purchaseId, PurchaseType.SESSION);
  }

  private async resolveInvoiceByType(purchaseId: string, type?: PurchaseType) {
    const payment = await this.paymentRepo.findOne({
      where: { id: purchaseId },
      relations: ['session', 'course', 'account', 'account.userDetail'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (type && payment.purchaseType !== type) {
      throw new BadRequestException(`This payment is not a ${type.toLowerCase()} invoice`);
    }

    const result = await this.generateInvoice(payment);
    const filePath = join(process.cwd(), 'uploads', 'invoices', result.fileName);
    return { filePath, fileName: result.fileName };
  }

  private async sendCourseSuccessNotifications(payment: Payment) {
    await this.sendCourseSuccessNotificationsById(payment.courseId, payment.accountId, payment.amount);
  }

  private async queueTutorEarningForSession(payment: Payment) {
    try {
      const session = await this.sessionRepo.findOne({ where: { id: payment.sessionId } });
      if (!session?.tutorId) return;
      const earningAmount = session.tutorEarnings ?? payment.amount;
      await this.walletService.creditTutorPendingEarning(
        session.tutorId,
        earningAmount,
        payment.id,
        `Session earning (releases in 7 days) - Payment #${payment.orderNumber}`,
      );
    } catch (error) {
      this.logger.warn('Failed to queue tutor session earning:', error?.message);
    }
  }

  private async queueTutorEarningForCourse(payment: Payment) {
    try {
      const course = await this.courseRepo.findOne({ where: { id: payment.courseId } });
      if (!course?.tutorId) return;
      await this.walletService.creditTutorPendingEarning(
        course.tutorId,
        payment.amount,
        payment.id,
        `Course earning (releases in 7 days) - ${course.name} - Payment #${payment.orderNumber}`,
      );
    } catch (error) {
      this.logger.warn('Failed to queue tutor course earning:', error?.message);
    }
  }
}

