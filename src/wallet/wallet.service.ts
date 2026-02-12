import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, } from './entities/wallet.entity';
import {  WithdrawFundsDto, } from './dto/wallet.dto';
import { TransactionStatus, TransactionType, UserRole } from 'src/enum';
import { WalletTransaction } from 'src/wallet-transaction/entities/wallet-transaction.entity';
import { Account } from 'src/account/entities/account.entity';
import Stripe from 'stripe';

@Injectable()
export class WalletService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
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
      throw new BadRequestException('Payment processing is currently unavailable. Please try again later.');
    }
  }

  async processStripeWebhook(body: any, signature: string) {
    this.checkStripeAvailability();
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'wallet_topup') {
        return await this.handleWalletTopupSuccess(session);
      }
    }

    return { received: true };
  }
  private async handleWalletTopupSuccess(session: Stripe.Checkout.Session) {
    const transactionId = session.metadata?.walletTransactionId;
    if (!transactionId) {
      throw new BadRequestException('Transaction ID not found in session metadata');
    }

    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
      relations: ['wallet']
    });

    if (!transaction) {
      throw new NotFoundException('Wallet transaction not found');
    }

    // Check if already processed (idempotent)
    if (transaction.status === TransactionStatus.COMPLETED) {
      return { message: 'Transaction already processed' };
    }

    // Start database transaction
    const queryRunner = this.walletRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update wallet balance
      const wallet = transaction.wallet;
      const newBalance = Number(wallet.balance) + Number(transaction.amount);
      wallet.balance = newBalance;
      
      // Get user role from metadata
      const userRole = session.metadata?.userRole;
      if (userRole === UserRole.TUTOR) {
        wallet.totalEarnings = Number(wallet.totalEarnings) + Number(transaction.amount);
      }
      
      await queryRunner.manager.save(wallet);

      // Update transaction status
      transaction.status = TransactionStatus.COMPLETED;
      transaction.balanceAfter = newBalance;
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      
      return { message: 'Wallet topped up successfully', balance: newBalance };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addFunds(accountId: string, amount: number) {
    this.checkStripeAvailability();
    
   
    const user = await this.accountRepo.findOne({ where: { id: accountId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) {
      wallet = await this.createWallet(accountId);
    }

  
    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      accountId,
      amount,
      type: TransactionType.CREDIT,
      status: TransactionStatus.PENDING,
      balanceBefore: wallet.balance
    });
    const savedTransaction = await this.transactionRepo.save(transaction);


    const checkoutSession = await this.stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Wallet Top-up',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment/success`,
      cancel_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment/cancel`,
      metadata: {
        walletTransactionId: savedTransaction.id,
        accountId,
        amount: amount.toString(),
        type: 'wallet_topup',
        userRole: user.roles
      },
    });

   
    savedTransaction.paymentIntentId = checkoutSession.id;
    await this.transactionRepo.save(savedTransaction);

    return {
      checkoutUrl: checkoutSession.url
    };
  }

  async confirmTransaction(accountId: string, transactionId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, accountId },
      relations: ['wallet']
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction already processed');
    }

    if (transaction.type === TransactionType.CREDIT) {
      const wallet = transaction.wallet;
      const newBalance = Number(wallet.balance) + Number(transaction.amount);
      wallet.balance = newBalance;
    
      
      await this.walletRepo.save(wallet);

      transaction.status = TransactionStatus.COMPLETED;
      transaction.balanceAfter = newBalance;
      await this.transactionRepo.save(transaction);

      return { message: 'Transaction confirmed successfully', balance: newBalance };
    }

    throw new BadRequestException('Invalid transaction type for confirmation');
  }

 

  async getWalletBalance(accountId: string) {
    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    
    if (!wallet) {
      wallet = await this.createWallet(accountId);
    }

    return {
      balance: wallet.balance,
      totalWithdrawals: wallet.totalWithdrawals
    };
  }

  async getTutorWalletBalance(accountId: string) {
    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    
    if (!wallet) {
      wallet = await this.createWallet(accountId);
    }


      return {
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      totalWithdrawals: wallet.totalWithdrawals
    };
  }

 

  async withdrawFunds(accountId: string, dto: WithdrawFundsDto) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.balance) < Number(dto.amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = Number(wallet.balance) - Number(dto.amount);
    wallet.balance = newBalance;
    wallet.totalWithdrawals = Number(wallet.totalWithdrawals) + Number(dto.amount);
    
    await this.walletRepo.save(wallet);

    await this.createTransaction(wallet.id, {
      amount: dto.amount,
      type: TransactionType.DEBIT,
      balanceAfter: newBalance
    });

    return { message: 'Funds withdrawn successfully', balance: newBalance };
  }


  private async createWallet(accountId: string) {
    const wallet = this.walletRepo.create({
      accountId,
      balance: 0,
      totalEarnings: 0,
      totalWithdrawals: 0
    });
    return await this.walletRepo.save(wallet);
  }

  private async createTransaction(walletId: string, data: any) {
    const transaction = this.transactionRepo.create({
      walletId,
      ...data,
      status: data.status || TransactionStatus.COMPLETED
    });
    return await this.transactionRepo.save(transaction);
  }
}
