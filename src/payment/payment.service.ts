import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { UserPurchase } from '../user-purchase/entities/user-purchase.entity';
import { Account } from '../account/entities/account.entity';
import { Session } from '../session/entities/session.entity';
import { PaymentStatus, PurchaseType } from '../enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NodeMailerService } from '../node-mailer/node-mailer.service';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly notificationsService: NotificationsService,
    private readonly nodeMailerService: NodeMailerService,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
      return;
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  private checkStripeAvailability() {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
    }
  }

  async createPaymentIntent(amount: number, currency = 'inr', metadata?: any) {
    this.checkStripeAvailability();
    try {
      return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
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

    const paymentIntent = await this.createPaymentIntent(
      purchase.amount,
      'inr',
      {
        sessionId,
        userId,
        purchaseId: purchase.id,
        tutorName: session.tutor?.tutorDetail?.[0]?.name || 'Tutor',
        sessionDate: session.sessionDate.toString(),
        startTime: session.startTime,
      }
    );

    purchase.stripePaymentIntentId = paymentIntent.id;
    await this.purchaseRepo.save(purchase);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: purchase.amount,
      currency: 'inr',
    };
  }

  async createCoursePayment(courseId: string, userId: string, amount: number) {
    const user = await this.accountRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const purchase = this.purchaseRepo.create({
      accountId: userId,
      courseId,
      purchaseType: PurchaseType.COURSE,
      amount,
      paymentStatus: PaymentStatus.PENDING
    });
    const savedPurchase = await this.purchaseRepo.save(purchase);

    const paymentIntent = await this.createPaymentIntent(
      amount,
      'inr',
      {
        courseId,
        userId,
        purchaseId: savedPurchase.id,
        purchaseType: 'course',
      }
    );

    savedPurchase.stripePaymentIntentId = paymentIntent.id;
    await this.purchaseRepo.save(savedPurchase);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'inr',
    };
  }

  async confirmPayment(paymentIntentId: string) {
    this.checkStripeAvailability();
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      const purchase = await this.purchaseRepo.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['session', 'course', 'account', 'account.userDetail']
      });

      if (!purchase) {
        throw new NotFoundException('Purchase not found for this payment');
      }

      if (paymentIntent.status === 'succeeded') {
        purchase.paymentStatus = PaymentStatus.COMPLETED;
        purchase.paidAt = new Date();
        await this.purchaseRepo.save(purchase);

        // Send notifications and emails
        await this.handleSuccessfulPayment(purchase, paymentIntent);
      } else if (paymentIntent.status === 'canceled') {
        purchase.paymentStatus = PaymentStatus.FAILED;
        await this.purchaseRepo.save(purchase);

        await this.handleFailedPayment(purchase);
      }

      return {
        status: paymentIntent.status,
        purchase,
        paymentIntent
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
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.dispute.created':
        await this.handleDispute(event.data.object as Stripe.Dispute);
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

  private async handleSuccessfulPayment(purchase: UserPurchase, paymentIntent: Stripe.PaymentIntent) {
    const user = purchase.account;
    let itemName: string;
    if (purchase.sessionId) {
      itemName = 'Session Booking';
    } else if (purchase.courseId) {
      itemName = 'Course Purchase';
    } else {
      itemName = 'Purchase';
    }

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

  private async handleDispute(dispute: Stripe.Dispute) {
    
    console.log('Payment dispute created:', dispute.id);
  
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

  async getPaymentHistory(userId: string, limit = 20, offset = 0) {
    const [purchases, total] = await this.purchaseRepo.findAndCount({
      where: { accountId: userId },
      relations: ['session', 'course'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    return {
      purchases: purchases.map(purchase => ({
        id: purchase.id,
        amount: purchase.amount,
        status: purchase.paymentStatus,
        type: purchase.purchaseType,
        createdAt: purchase.createdAt,
        paidAt: purchase.paidAt,
        sessionDetails: purchase.sessionId ? {
          sessionId: purchase.sessionId
        } : null,
        courseDetails: purchase.courseId ? {
          courseId: purchase.courseId
        } : null
      })),
      total,
      limit,
      offset
    };
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

  async createCustomer(email: string, name: string, userId: string) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });

    
      await this.accountRepo.update(
        { id: userId },
        { stripeCustomerId: customer.id }
      );

      return customer;
    } catch (error) {
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }
}