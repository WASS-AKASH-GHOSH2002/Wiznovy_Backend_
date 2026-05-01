import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WithdrawFundsDto } from './dto/wallet.dto';
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
    this.stripe = new Stripe(stripeKey, { apiVersion: '2025-10-29.clover' });
  }

  private checkStripeAvailability() {
    if (!this.stripe) {
      throw new BadRequestException('Payment processing is currently unavailable. Please try again later.');
    }
  }

  async processStripeWebhook(body: any, signature: string) {
    this.checkStripeAvailability();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new BadRequestException('Webhook secret not configured');

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
    if (!transactionId) throw new BadRequestException('Transaction ID not found in session metadata');

    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId },
      relations: ['wallet'],
    });
    if (!transaction) throw new NotFoundException('Wallet transaction not found');
    if (transaction.status === TransactionStatus.COMPLETED) return { message: 'Transaction already processed' };

    const queryRunner = this.walletRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = transaction.wallet;
      const newBalance = Number(wallet.balance) + Number(transaction.amount);
      wallet.balance = newBalance;
      const userRole = session.metadata?.userRole;
      if (userRole === UserRole.TUTOR) {
        wallet.totalEarnings = Number(wallet.totalEarnings) + Number(transaction.amount);
      }
      await queryRunner.manager.save(wallet);
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
    if (!user) throw new NotFoundException('User not found');

    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) wallet = await this.createWallet(accountId);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      accountId,
      amount,
      type: TransactionType.CREDIT,
      status: TransactionStatus.PENDING,
      balanceBefore: wallet.balance,
    });
    const savedTransaction = await this.transactionRepo.save(transaction);

    const checkoutSession = await this.stripe.checkout.sessions.create({
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Wallet Top-up' }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      mode: 'payment',
      success_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment/success`,
      cancel_url: `${process.env.WIZNOVY_CDN_LINK}api/v1/payment/cancel`,
      metadata: { walletTransactionId: savedTransaction.id, accountId, amount: amount.toString(), type: 'wallet_topup', userRole: user.roles },
    });

    savedTransaction.paymentIntentId = checkoutSession.id;
    await this.transactionRepo.save(savedTransaction);
    return { checkoutUrl: checkoutSession.url };
  }

  async confirmTransaction(accountId: string, transactionId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, accountId },
      relations: ['wallet'],
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING) throw new BadRequestException('Transaction already processed');

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
    if (!wallet) wallet = await this.createWallet(accountId);
    return { balance: wallet.balance, totalWithdrawals: wallet.totalWithdrawals };
  }

  async getTutorWalletBalance(accountId: string) {
    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) wallet = await this.createWallet(accountId);
    return { balance: wallet.balance, totalEarnings: wallet.totalEarnings, totalWithdrawals: wallet.totalWithdrawals };
  }

  async withdrawFunds(accountId: string, dto: WithdrawFundsDto) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < Number(dto.amount)) throw new BadRequestException('Insufficient balance');

    const newBalance = Number(wallet.balance) - Number(dto.amount);
    wallet.balance = newBalance;
    wallet.totalWithdrawals = Number(wallet.totalWithdrawals) + Number(dto.amount);
    await this.walletRepo.save(wallet);
    await this.createTransaction(wallet.id, { amount: dto.amount, type: TransactionType.DEBIT, balanceAfter: newBalance });
    return { message: 'Funds withdrawn successfully', balance: newBalance };
  }

  async createWalletForAccount(accountId: string) {
    const walletId = await this.generateWalletId();
    return await this.walletRepo.save(this.walletRepo.create({ accountId, walletId, balance: 0, totalEarnings: 0, totalWithdrawals: 0 }));
  }

  private async generateWalletId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA').split('-').join('');
    const prefix = 'WAL';
    const lastWallet = await this.walletRepo.createQueryBuilder('wallet')
      .where('wallet.walletId LIKE :pattern', { pattern: `${prefix}%/%` })
      .orderBy('wallet.walletId', 'DESC')
      .getOne();
    let sequence = 1001;
    const lastSequence = lastWallet?.walletId ? Number.parseInt(lastWallet.walletId.split('/')[1], 10) : Number.NaN;
    if (!Number.isNaN(lastSequence)) sequence = lastSequence + 1;
    return `${prefix}${dateStr}/${sequence}`;
  }

  private async createWallet(accountId: string) {
    const walletId = await this.generateWalletId();
    return await this.walletRepo.save(this.walletRepo.create({ accountId, walletId, balance: 0, totalEarnings: 0, totalWithdrawals: 0 }));
  }

  private async createTransaction(walletId: string, data: any) {
    const transaction = this.transactionRepo.create({ walletId, ...data, status: data.status || TransactionStatus.COMPLETED });
    return await this.transactionRepo.save(transaction);
  }

  async purchaseSession(accountId: string, sessionAmount: number, sessionId: string) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < Number(sessionAmount)) throw new BadRequestException('Insufficient wallet balance');

    const newBalance = Number(wallet.balance) - Number(sessionAmount);
    wallet.balance = newBalance;
    await this.walletRepo.save(wallet);

    await this.transactionRepo.save(this.transactionRepo.create({
      walletId: wallet.id, accountId, amount: sessionAmount,
      type: TransactionType.DEBIT, status: TransactionStatus.COMPLETED,
      balanceBefore: Number(wallet.balance) + Number(sessionAmount), balanceAfter: newBalance,
    }));
    return { message: 'Session purchased successfully', balance: newBalance };
  }

  async purchaseCourse(accountId: string, courseAmount: number, courseId: string) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < Number(courseAmount)) throw new BadRequestException('Insufficient wallet balance');

    const newBalance = Number(wallet.balance) - Number(courseAmount);
    wallet.balance = newBalance;
    await this.walletRepo.save(wallet);

    await this.transactionRepo.save(this.transactionRepo.create({
      walletId: wallet.id, accountId, amount: courseAmount,
      type: TransactionType.DEBIT, status: TransactionStatus.COMPLETED,
      balanceBefore: Number(wallet.balance) + Number(courseAmount), balanceAfter: newBalance,
    }));
    return { message: 'Course purchased successfully', balance: newBalance };
  }

  async creditTutorPendingEarning(tutorId: string, amount: number, referenceId: string, description: string) {
    let wallet = await this.walletRepo.findOne({ where: { accountId: tutorId } });
    if (!wallet) wallet = await this.createWallet(tutorId);

    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 7);

    await this.transactionRepo.save(this.transactionRepo.create({
      walletId: wallet.id,
      accountId: tutorId,
      amount,
      type: TransactionType.PENDING_EARNING,
      status: TransactionStatus.PENDING,
      balanceBefore: wallet.balance,
      releaseDate,
      referenceId,
      description,
    }));
  }

  async releaseMaturePendingEarnings() {
    const now = new Date();
    const pending = await this.transactionRepo.find({
      where: { type: TransactionType.PENDING_EARNING, status: TransactionStatus.PENDING },
      relations: ['wallet'],
    });

    for (const tx of pending) {
      if (!tx.releaseDate || tx.releaseDate > now) continue;

      const wallet = tx.wallet;
      const newBalance = Number(wallet.balance) + Number(tx.amount);
      wallet.balance = newBalance;
      wallet.totalEarnings = Number(wallet.totalEarnings) + Number(tx.amount);
      await this.walletRepo.save(wallet);

      tx.status = TransactionStatus.COMPLETED;
      tx.type = TransactionType.CREDIT;
      tx.balanceAfter = newBalance;
      await this.transactionRepo.save(tx);
    }
  }

  async getTutorPendingEarnings(tutorId: string) {
    const pending = await this.transactionRepo.find({
      where: { accountId: tutorId, type: TransactionType.PENDING_EARNING, status: TransactionStatus.PENDING },
      order: { releaseDate: 'ASC' },
    });
    const total = pending.reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { pendingEarnings: pending, totalPending: total };
  }
}
