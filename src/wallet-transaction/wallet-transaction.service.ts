import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets, SelectQueryBuilder } from 'typeorm';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletTransactionPaginationDto } from './dto/create-wallet-transaction.dto';
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

  private readonly baseTransactionSelect = [
    'transaction.id',
    'transaction.amount',
    'transaction.type',
    'transaction.status',
    'transaction.balanceBefore',
    'transaction.balanceAfter',
    'transaction.paymentIntentId',
    'transaction.createdAt',
    'transaction.updatedAt',
    'transaction.accountId',
    'transaction.walletId',
    'account.id',
    'account.email',
    'account.roles',
    'userDetail.name',
    'tutorDetail.name',
    'wallet.id',
    'wallet.balance',
    'wallet.totalEarnings',
    'wallet.totalWithdrawals',
  ];

  private buildDetailQuery(): SelectQueryBuilder<WalletTransaction> {
    return this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('account.tutorDetail', 'tutorDetail')
      .leftJoin('transaction.wallet', 'wallet')
      .select(this.baseTransactionSelect);
  }

  private applyCommonFilters(
    qb: SelectQueryBuilder<WalletTransaction>,
    dto: WalletTransactionPaginationDto,
  ) {
    if (dto.type) qb.andWhere('transaction.type = :type', { type: dto.type });
    if (dto.status) qb.andWhere('transaction.status = :status', { status: dto.status });
    if (dto.fromDate) qb.andWhere('transaction.createdAt >= :fromDate', { fromDate: dto.fromDate });
    if (dto.toDate) qb.andWhere('transaction.createdAt <= :toDate', { toDate: `${dto.toDate} 23:59:59` });
  }

  private applyPagination(
    qb: SelectQueryBuilder<WalletTransaction>,
    dto: WalletTransactionPaginationDto,
  ) {
    return qb.orderBy('transaction.createdAt', 'DESC').skip(dto.offset).take(dto.limit);
  }

  async adminFindOne(id: string) {
    const transaction = await this.buildDetailQuery()
      .addSelect(['wallet.walletId', 'userDetail.userId', 'tutorDetail.tutorId'])
      .where('transaction.id = :id', { id })
      .getOne();

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async adminFindAll(dto: WalletTransactionPaginationDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .leftJoin('account.userDetail', 'userDetail')
      .leftJoin('account.tutorDetail', 'tutorDetail')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.type',
        'transaction.status',
        'transaction.balanceBefore',
        'transaction.balanceAfter',
        'transaction.createdAt',
        'transaction.accountId',
        'account.id',
        'account.email',
        'account.roles',
        'userDetail.name',
        'tutorDetail.name',
      ]);

    if (dto.accountId) qb.andWhere('transaction.accountId = :accountId', { accountId: dto.accountId });
    this.applyCommonFilters(qb, dto);

    const [result, total] = await this.applyPagination(qb, dto).getManyAndCount();
    return { result, total };
  }

  async findAll(accountId: string, dto: WalletTransactionPaginationDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.wallet', 'wallet')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.type',
        'transaction.status',
        'transaction.balanceBefore',
        'transaction.balanceAfter',
        'transaction.createdAt',
        'wallet.id',
      ])
      .where('transaction.accountId = :accountId', { accountId });

    this.applyCommonFilters(qb, dto);

    if (dto.keyword) {
      qb.andWhere(new Brackets(qb2 => {
        qb2.where('transaction.description LIKE :keyword', { keyword: `%${dto.keyword}%` })
           .orWhere('transaction.referenceId LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await this.applyPagination(qb, dto).getManyAndCount();
    return { result, total };
  }

  async findOne(id: string, accountId: string) {
    const transaction = await this.buildDetailQuery()
      .where('transaction.id = :id', { id })
      .andWhere('transaction.accountId = :accountId', { accountId })
      .getOne();

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async getWalletBalance(accountId: string) {
    const wallet = await this.walletRepo.findOne({ where: { accountId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      totalWithdrawals: wallet.totalWithdrawals,
    };
  }

  async getTransactionStats(accountId: string) {
    const stats = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select([
        'SUM(CASE WHEN transaction.type = :credit THEN transaction.amount ELSE 0 END) as totalCredits',
        'SUM(CASE WHEN transaction.type = :debit THEN transaction.amount ELSE 0 END) as totalDebits',
        'COUNT(*) as totalTransactions',
      ])
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .setParameters({ credit: TransactionType.CREDIT, debit: TransactionType.DEBIT })
      .getRawOne();

    return {
      totalCredits: Number.parseFloat(stats.totalCredits) || 0,
      totalDebits: Number.parseFloat(stats.totalDebits) || 0,
      totalTransactions: Number.parseInt(stats.totalTransactions) || 0,
    };
  }

  private async findByRole(
    accountId: string,
    dto: WalletTransactionPaginationDto,
    role: 'USER' | 'TUTOR',
  ) {
    const detailJoin = role === 'USER' ? 'userDetail' : 'tutorDetail';
    const detailEntity = role === 'USER' ? 'account.userDetail' : 'account.tutorDetail';

    const qb = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.wallet', 'wallet')
      .leftJoin('transaction.account', 'account')
      .leftJoin(detailEntity, detailJoin)
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
        `${detailJoin}.name`,
      ])
      .where('transaction.accountId = :accountId', { accountId })
      .andWhere('account.role = :role', { role });

    this.applyCommonFilters(qb, dto);

    if (dto.keyword) {
      qb.andWhere(new Brackets(qb2 => {
        qb2.where(`${detailJoin}.firstName LIKE :keyword`, { keyword: `%${dto.keyword}%` })
           .orWhere(`${detailJoin}.lastName LIKE :keyword`, { keyword: `%${dto.keyword}%` });
      }));
    }

    const [result, total] = await this.applyPagination(qb, dto).getManyAndCount();
    return { result, total };
  }

  findByUser(accountId: string, dto: WalletTransactionPaginationDto) {
    return this.findByRole(accountId, dto, 'USER');
  }

  findByTutor(accountId: string, dto: WalletTransactionPaginationDto) {
    return this.findByRole(accountId, dto, 'TUTOR');
  }
}
