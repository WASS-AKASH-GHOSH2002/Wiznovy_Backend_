import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, WalletTransaction, TransactionType, TransactionStatus } from './entities/wallet.entity';
import { AddFundsDto, WithdrawFundsDto, TransactionHistoryDto } from './dto/wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
  ) {}

  async getWalletBalance(accountId: string) {
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

  async addFunds(accountId: string, dto: AddFundsDto) {
    let wallet = await this.walletRepo.findOne({ where: { accountId } });
    
    if (!wallet) {
      wallet = await this.createWallet(accountId);
    }

    const newBalance = Number(wallet.balance) + Number(dto.amount);
    wallet.balance = newBalance;
    wallet.totalEarnings = Number(wallet.totalEarnings) + Number(dto.amount);
    
    await this.walletRepo.save(wallet);

    await this.createTransaction(wallet.id, {
      amount: dto.amount,
      type: TransactionType.CREDIT,
      description: dto.description,
      referenceId: dto.referenceId,
      balanceAfter: newBalance
    });

    return { message: 'Funds added successfully', balance: newBalance };
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
      description: dto.description,
      referenceId: dto.referenceId,
      balanceAfter: newBalance
    });

    return { message: 'Funds withdrawn successfully', balance: newBalance };
  }

  async getTransactionHistory(accountId: string, dto: TransactionHistoryDto) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    
    if (!wallet) {
      return { result: [], total: 0 };
    }

    const query = this.transactionRepo.createQueryBuilder('transaction')
      .where('transaction.walletId = :walletId', { walletId: wallet.id });

    if (dto.type) {
      query.andWhere('transaction.type = :type', { type: dto.type });
    }

    const [result, total] = await query
      .orderBy('transaction.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
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
      status: TransactionStatus.COMPLETED
    });
    return await this.transactionRepo.save(transaction);
  }
}
