
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankDetail } from './entities/bank-detail.entity';
import { CreateBankDetailDto, UpdateBankDetailDto } from './dto/bank-detail.dto';

@Injectable()
export class BankDetailsService {
  constructor(
    @InjectRepository(BankDetail)
    private readonly bankDetailRepo: Repository<BankDetail>,
  ) {}

  async create(tutorId: string, dto: CreateBankDetailDto) {
    const existingBankDetail = await this.bankDetailRepo.findOne({
      where: { tutorId }
    });

    if (existingBankDetail) {
      throw new ConflictException('Bank details already exist for this tutor');
    }

    const bankDetail = this.bankDetailRepo.create({
      tutorId,
      ...dto
    });

    const savedBankDetail = await this.bankDetailRepo.save(bankDetail);
    return { message: 'Bank details created successfully', bankDetail: savedBankDetail };
  }

  async findByTutorId(tutorId: string) {
    const bankDetail = await this.bankDetailRepo.findOne({
      where: { tutorId }
    });

    if (!bankDetail) {
      throw new NotFoundException('Bank details not found');
    }

    return bankDetail;
  }

  async update(id: string, tutorId: string, dto: UpdateBankDetailDto) {
    const bankDetail = await this.bankDetailRepo.findOne({
      where: { id, tutorId }
    });

    if (!bankDetail) {
      throw new NotFoundException('Bank details not found');
    }

    Object.assign(bankDetail, dto);
    const updatedBankDetail = await this.bankDetailRepo.save(bankDetail);
    return { message: 'Bank details updated successfully', bankDetail: updatedBankDetail };
  }

  async remove(id: string, tutorId: string) {
    const bankDetail = await this.bankDetailRepo.findOne({
      where: { id, tutorId }
    });

    if (!bankDetail) {
      throw new NotFoundException('Bank details not found');
    }

    await this.bankDetailRepo.remove(bankDetail);
    return { message: 'Bank details deleted successfully' };
  }
}
