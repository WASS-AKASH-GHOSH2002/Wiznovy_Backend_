import { Injectable, NotFoundException,  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import {  WalletTransactionPaginationDto } from './dto/create-wallet-transaction.dto';
import { TransactionType, TransactionStatus } from 'src/enum';

@Injectable()
export class WalletTransactionService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  

  async findAll(accountId: string, dto: WalletTransactionPaginationDto) {
    const queryBuilder = this.transactionRepo.createQueryBuilder('transaction')
      .leftJoin('transaction.wallet', 'wallet')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.type',
        'transaction.status',
        'transaction.balanceBefore',
        'transaction.balanceAfter',
        'transaction.createdAt',
        'wallet.id'
      ])
      .where('transaction.accountId = :accountId', { accountId });

    if (dto.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: dto.type });
    }

    if (dto.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: dto.status });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('transaction.description LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('transaction.referenceId LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findOne(id: string, accountId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id, accountId },
      relations: ['wallet']
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

 

  async getWalletBalance(accountId: string) {
    const wallet = await this.walletRepo.findOne({
      where: { accountId }
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      totalWithdrawals: wallet.totalWithdrawals
    };
  }



 

  async getTransactionStats(accountId: string) {
    const stats = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select([
        'SUM(CASE WHEN transaction.type = :credit THEN transaction.amount ELSE 0 END) as totalCredits',
        'SUM(CASE WHEN transaction.type = :debit THEN transaction.amount ELSE 0 END) as totalDebits',
        'COUNT(*) as totalTransactions'
      ])
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .setParameters({
        credit: TransactionType.CREDIT,
        debit: TransactionType.DEBIT
      })
      .getRawOne();

    return {
      totalCredits: Number.parseFloat(stats.totalCredits) || 0,
      totalDebits: Number.parseFloat(stats.totalDebits) || 0,
      totalTransactions: Number.parseInt(stats.totalTransactions) || 0
    };
  }

  async findByUser(accountId: string, dto: WalletTransactionPaginationDto) {
    const queryBuilder = this.transactionRepo.createQueryBuilder('transaction')
      .leftJoin('transaction.wallet', 'wallet')
      .leftJoin('transaction.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.type',
        'transaction.status',
        'transaction.balanceBefore',
        'transaction.balanceAfter',
        'transaction.createdAt',
        'wallet.id',
        
        'account.id',
        'userDetail.name',
        
      ])
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('account.role = :role', { role: 'USER' });

    if (dto.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: dto.type });
    }

    if (dto.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: dto.status });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('userDetail.firstName LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('userDetail.lastName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByTutor(accountId: string, dto: WalletTransactionPaginationDto) {
    const queryBuilder = this.transactionRepo.createQueryBuilder('transaction')
      .leftJoin('transaction.wallet', 'wallet')
      .leftJoin('transaction.account', 'account')
      .leftJoin('account.tutorDetail', 'tutorDetail')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.type',
        'transaction.status',
        'transaction.balanceBefore',
        'transaction.balanceAfter',
        'transaction.createdAt',
        'wallet.id',
        'account.id',
        'tutorDetail.name',
        
      ])
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('account.role = :role', { role: 'TUTOR' });

    if (dto.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: dto.type });
    }

    if (dto.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: dto.status });
    }

    if (dto.keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('tutorDetail.firstName LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('tutorDetail.lastName LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }
}