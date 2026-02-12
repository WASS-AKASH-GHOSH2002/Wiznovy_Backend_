import { Injectable } from '@nestjs/common';
import { ContactUsPaginationDto, CreateContactUsDto } from './dto/create-contact-us.dto';
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
        'contactUs.categoryId',
        'category.id',
        'category.title',
    

      ]);
      if (dto.categoryId) {
        query.andWhere('contactUs.categoryId = :categoryId', {
          categoryId: dto.categoryId,
        });
      }
    if (keyword && keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'contactUs.firstName LIKE :keyword OR contactUs.lastName LIKE :keyword OR contactUs.email LIKE :keyword OR contactUs.phoneNumber LIKE :keyword OR contactUs.message LIKE :keyword OR category.title LIKE :keyword',
            {
              keyword: '%' + keyword + '%',
            },
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
