import { Injectable } from '@nestjs/common';
import { ContactUsPaginationDto, ContactUsStatusDto, CreateContactUsDto } from './dto/create-contact-us.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUs } from './entities/contact-us.entity';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class ContactUsService {
  constructor(
    @InjectRepository(ContactUs) private readonly repo: Repository<ContactUs>,
  ) {}

  async create(dto: CreateContactUsDto) {
    const contactUs = this.repo.create(dto);
    return this.repo.save(contactUs);
  }


  async findAll(dto: ContactUsPaginationDto) {
    const keyword = dto.keyword || '';
    const query = this.repo
      .createQueryBuilder('contactUs')
      .leftJoinAndSelect('contactUs.category', 'category')
      
      .select([
        'contactUs.id',
        'contactUs.firstName',
        'contactUs.lastName',
        'contactUs.email',
        'contactUs.phoneNumber',
        'contactUs.message',
        'contactUs.createdAt',
        'contactUs.status',
        'contactUs.categoryId',
        'category.id',
        'category.title',
        'category.type',

      ]);
      if (dto.categoryId) {
        query.andWhere('contactUs.categoryId = :categoryId', {
          categoryId: dto.categoryId,
        });
      }
      if (dto.type) {
        query.andWhere('category.type = :type', { type: dto.type });
      }
      if (dto.status) {
        query.andWhere('contactUs.status = :status', { status: dto.status });
      }
      if (dto.startDate) {
        query.andWhere('contactUs.createdAt >= :startDate', { startDate: new Date(dto.startDate) });
      }
      if (dto.endDate) {
        const end = new Date(dto.endDate);
        end.setHours(23, 59, 59, 999);
        query.andWhere('contactUs.createdAt <= :endDate', { endDate: end });
      }
    if (keyword && keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'contactUs.firstName LIKE :keyword OR contactUs.lastName LIKE :keyword OR CONCAT(contactUs.firstName, \' \', contactUs.lastName) LIKE :keyword OR contactUs.email LIKE :keyword OR contactUs.phoneNumber LIKE :keyword OR contactUs.message LIKE :keyword OR category.title LIKE :keyword',
            { keyword: '%' + keyword + '%' },
          );
        }),
      );
    }

    const [result, total] = await query
      .orderBy({ 'contactUs.createdAt': 'DESC' })
      .take(dto.limit)
      .skip(dto.offset)
      .getManyAndCount();

    return { result, total };
  }

  async updateStatus(id: string, dto: ContactUsStatusDto) {
    const contactUs = await this.repo.findOne({ where: { id } });
    if (!contactUs) {
      throw new Error('Contact us entry not found');
    }
    Object.assign(contactUs, dto);
    return this.repo.save(contactUs);
  }

  async findOne(id: string) {
    const contactUs = await this.repo.createQueryBuilder('contactUs')
      .leftJoinAndSelect('contactUs.category', 'category')
      .where('contactUs.id = :id', { id })
      .getOne();

    if (!contactUs) {
      throw new Error('Contact us entry not found');
    }

    return contactUs;
  }
}
