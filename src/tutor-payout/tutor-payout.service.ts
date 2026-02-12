import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { TutorPayout } from './entities/tutor-payout.entity';
import { CreatePayoutDto, PayoutPaginationDto, ApprovePayoutDto, RejectPayoutDto } from './dto/payout.dto';
import { NodeMailerService } from 'src/node-mailer/node-mailer.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Account } from 'src/account/entities/account.entity';
import { BankDetail } from 'src/bank-details/entities/bank-detail.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { PayoutStatus } from 'src/enum';

@Injectable()
export class TutorPayoutService {
  constructor(
    @InjectRepository(TutorPayout)
    private readonly payoutRepo: Repository<TutorPayout>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(BankDetail)
    private readonly bankDetailRepo: Repository<BankDetail>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly nodeMailerService: NodeMailerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPayout(tutorId: string, dto: CreatePayoutDto) {
    
    const pendingPayout = await this.payoutRepo.findOne({
      where: { tutorId, status: PayoutStatus.PENDING }
    });

    if (pendingPayout) {
      throw new BadRequestException('You already have a pending payout request');
    }

    
    let wallet = await this.walletRepo.findOne({
      where: { accountId: tutorId }
    });

    if(!wallet){
      wallet = await this.walletRepo.save(this.walletRepo.create({ accountId: tutorId }));
    }

    const walletBalance = wallet.balance || 0;
    if (dto.amount > walletBalance) {
      throw new BadRequestException(`Insufficient wallet balance. Available: $${walletBalance}`);
    }

    if (dto.amount < 10) {
      throw new BadRequestException('Minimum payout amount is $10');
    }

   
    const bankDetails = await this.bankDetailRepo.findOne({
      where: { tutorId }
    });

    if (!bankDetails) {
      throw new BadRequestException('Please add your bank details before requesting payout');
    }

 
    if (!bankDetails.accountNo || !bankDetails.accountHolderName || !bankDetails.ifscCode || !bankDetails.bankName) {
      throw new BadRequestException('Please complete all required bank details (Account Number, Holder Name, IFSC Code, Bank Name)');
    }

 
    if (dto.bankDetailId && dto.bankDetailId !== bankDetails.id) {
      throw new BadRequestException('Invalid bank detail ID provided');
    }

  

    const payout = this.payoutRepo.create({
      tutorId,
      amount: dto.amount,
      bankDetailId: dto.bankDetailId,
      status: PayoutStatus.PENDING
    });

    const savedPayout = await this.payoutRepo.save(payout);

    await this.notificationsService.create({
      title: 'Payout Request Submitted',
      desc: `Your payout request for $${dto.amount} has been submitted for review`,
      type: 'PAYOUT_SUBMITTED',
      accountId: tutorId
    });

   

    return { message: 'Payout request created successfully', payout: savedPayout };
  }

  async getAllPayouts(dto: PayoutPaginationDto) {
    const query = this.payoutRepo.createQueryBuilder('payout')
      .leftJoin('payout.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('payout.approver', 'approver')
      .leftJoin('approver.staffDetail', 'staffDetail')
      .leftJoin('payout.bankDetail', 'bankDetail')
      .select([
        'payout.id',
        'payout.amount',
        'payout.paymentMethod',
        'payout.status',
        'payout.transactionId',
        'payout.notes',
        'payout.createdAt',
        'payout.approvedAt',
        'payout.paidAt',
        'payout.rejectionReason',
        'tutor.id',
        'tutor.email',
        'tutorDetail.name',
        'tutorDetail.profileImage',
        'approver.id',
        'staffDetail.name',
        'bankDetail.accountNo',
        'bankDetail.accountHolderName',
        'bankDetail.ifscCode',
        'bankDetail.bankName',
        'bankDetail.branchName',
        'bankDetail.swiftCode', 
      ]);

    if (dto.status) {
      query.andWhere('payout.status = :status', { status: dto.status });
    }

    if (dto.tutorName) {
      query.andWhere('tutorDetail.name LIKE :tutorName', { tutorName: `%${dto.tutorName}%` });
    }

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('tutorDetail.name LIKE :keyword', { keyword: `%${dto.keyword}%` })
          .orWhere('tutor.email LIKE :keyword', { keyword: `%${dto.keyword}%` })
            .orWhere('payout.amount LIKE :keyword', { keyword: `%${dto.keyword}%` });
        })
      );
    }

    if (dto.fromDate) {
      query.andWhere('payout.createdAt >= :fromDate', { fromDate: dto.fromDate });
    }

    if (dto.toDate) {
      query.andWhere('payout.createdAt <= :toDate', { toDate: dto.toDate });
    }

    const [result, total] = await query
      .orderBy('payout.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async getTutorPayouts(tutorId: string) {
    return await this.payoutRepo.find({
      where: { tutorId },
      order: { createdAt: 'DESC' }
    });
  }

  async getPayoutDetails(id: string) {
    const payout = await this.payoutRepo.createQueryBuilder('payout')
       .leftJoin('payout.tutor', 'tutor')
      .leftJoin('tutor.tutorDetail', 'tutorDetail')
      .leftJoin('payout.approver', 'approver')
      .leftJoin('payout.bankDetail', 'bankDetail')
      .select([
        'payout.id',
        'payout.amount',
        'payout.paymentMethod',
        'payout.status',
        'payout.transactionId',
        'payout.notes',
        'payout.createdAt',
        'payout.approvedAt',
        'payout.paidAt',
        'payout.rejectionReason',
        'tutor.id',
        'tutor.email',
        'tutorDetail.name',
        'tutorDetail.profileImage',
        'approver.id',
        'approver.email',
        'bankDetail.accountNo',
        'bankDetail.accountHolderName',
        'bankDetail.ifscCode',
        'bankDetail.bankName',
        'bankDetail.branchName',
        'bankDetail.swiftCode',
        'bankDetail.passbookFile',
        'bankDetail.documentFile',

      ])
      .where('payout.id = :id', { id })
      .getOne();

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    return payout;
  }

  async approvePayout(id: string, approvedBy: string, dto: ApprovePayoutDto) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
      relations: ['tutor', 'tutor.tutorDetail']
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Only pending payouts can be approved');
    }

 
    const wallet = await this.walletRepo.findOne({
      where: { accountId: payout.tutorId }
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.balance) < Number(payout.amount)) {
      throw new BadRequestException(`Insufficient wallet balance. Available: $${wallet.balance}, Requested: $${payout.amount}`);
    }

    
    wallet.balance = Number(wallet.balance) - Number(payout.amount);
    wallet.totalWithdrawals = Number(wallet.totalWithdrawals || 0) + Number(payout.amount);
    await this.walletRepo.save(wallet);

    payout.status = dto.status ;
    payout.approvedBy = approvedBy;
    payout.approvedAt = new Date();
    payout.paidAt = dto.paidAt ? new Date(dto.paidAt + 'Z') : new Date();
    
    if (dto.transactionId) {
      payout.transactionId = dto.transactionId;
    }
    
    if (dto.notes) {
      payout.notes = dto.notes;
    }
    
    if (dto.paymentMethod) {
      payout.paymentMethod = dto.paymentMethod;
    }

    await this.payoutRepo.save(payout);

    await this.notificationsService.create({
      title: 'Payout Approved',
      desc: `Your payout request for $${payout.amount} has been approved and processed`,
      type: 'PAYOUT_APPROVED',
      accountId: payout.tutorId
    });

    if (payout.tutor?.email) {
      const tutorName = payout.tutor.tutorDetail?.[0]?.name || 'Tutor';
      this.nodeMailerService.sendPayoutStatusEmail(
        payout.tutor.email,
        tutorName,
        payout.amount,
        'APPROVED',
        dto.transactionId
      ).catch(err => console.error('Email send failed:', err));
    }

    return { message: 'Payout approved and processed successfully' };
  }

  async rejectPayout(id: string, rejectedBy: string, dto: RejectPayoutDto) {
    const payout = await this.payoutRepo.findOne({
      where: { id },
      relations: ['tutor', 'tutor.tutorDetail']
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Only pending payouts can be rejected');
    }

    payout.status = PayoutStatus.REJECTED;
    payout.rejectionReason = dto.rejectionReason;
    payout.approvedBy = rejectedBy;
    payout.approvedAt = new Date();

    await this.payoutRepo.save(payout);

    await this.notificationsService.create({
      title: 'Payout Rejected',
      desc: `Your payout request for $${payout.amount} has been rejected. Reason: ${dto.rejectionReason}`,
      type: 'PAYOUT_REJECTED',
      accountId: payout.tutorId
    });

    if (payout.tutor?.email) {
      const tutorName = payout.tutor.tutorDetail?.[0]?.name || 'Tutor';
      await this.nodeMailerService.sendPayoutStatusEmail(
        payout.tutor.email,
        tutorName,
        payout.amount,
        'REJECTED',
        undefined,
        dto.rejectionReason
      );
    }

    return { message: 'Payout rejected successfully', payout };
  }
}