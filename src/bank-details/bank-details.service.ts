
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankDetail } from './entities/bank-detail.entity';
import { CreateBankDetailDto, UpdateBankDetailDto } from './dto/bank-detail.dto';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

@Injectable()
export class BankDetailsService {
  constructor(
    @InjectRepository(BankDetail)
    private readonly bankDetailRepo: Repository<BankDetail>,
  ) {}

  async create(tutorId: string, dto: CreateBankDetailDto) {
    const existingCount = await this.bankDetailRepo.count({
      where: { tutorId }
    });

    if (existingCount >= 1) {
      throw new ConflictException('Maximum 1 bank account allowed per tutor');
    }

    const bankDetail = this.bankDetailRepo.create({
      tutorId,
      ...dto
    });

    const savedBankDetail = await this.bankDetailRepo.save(bankDetail);
    return { message: 'Bank details created successfully', bankDetail: savedBankDetail };
  }

  async findByTutorId(tutorId: string) {
    const bankDetails = await this.bankDetailRepo.find({
      where: { tutorId }
    });

    return bankDetails;
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


  async findOne(id: string) {
    const bankDetail = await this.bankDetailRepo.findOne({ where: { id } });
    if (!bankDetail) {
      throw new NotFoundException('Bank details not found');
    }
    return bankDetail;
  }

  async updatePassbookImage(id: string, tutorId: string, filePath: string) {
    const bankDetail = await this.bankDetailRepo.findOne({ 
      where: { id, tutorId } 
    });
    
    if (!bankDetail) {
      throw new NotFoundException('Bank details not found or unauthorized');
    }
    
    if (bankDetail.passbookFile && bankDetail.passbookFilePath) {
      const oldPath = join(__dirname, '..', '..', bankDetail.passbookFilePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old passbook file: ${oldPath}`, err.message);
      }
    }
    
    bankDetail.passbookFile = process.env.WIZNOVY_CDN_LINK + filePath;
    bankDetail.passbookFilePath = filePath;
    return this.bankDetailRepo.save(bankDetail);
  }

  async updateDocument(id: string, tutorId: string, filePath: string) {
    const bankDetail = await this.bankDetailRepo.findOne({ 
      where: { id, tutorId } 
    });
    
    if (!bankDetail) {
      throw new NotFoundException('Bank details not found or unauthorized');
    }
    
    if (bankDetail.documentFile && bankDetail.documentFilePath) {
      const oldPath = join(__dirname, '..', '..', bankDetail.documentFilePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old document file: ${oldPath}`, err.message);
      }
    }

    bankDetail.documentFile = process.env.WIZNOVY_CDN_LINK + filePath;
    bankDetail.documentFilePath = filePath;
    return this.bankDetailRepo.save(bankDetail);
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
