import { Injectable } from '@nestjs/common';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUs } from './entities/contact-us.entity';
import { Brackets,  Repository } from 'typeorm';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';

@Injectable()
export class ContactUsService {
  constructor(
    @InjectRepository(ContactUs) private readonly repo: Repository<ContactUs>,
  ) {}

  async create(dto: CreateContactUsDto) {
    const obj = Object.create(dto);
    return this.repo.save(obj);
  }


  async findAll(dto: CommonPaginationDto) {
    const keyword = dto.keyword || '';
    const query = this.repo
      .createQueryBuilder('contactUs')
      .leftJoinAndSelect('contactUs.account', 'account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .leftJoinAndSelect('account.tutorDetail','tutorDetail')
      .select([
        'contactUs.id',
        'contactUs.query',
        'contactUs.createdAt',

        'account.id',
        'account.email',

        'userDetail.id',
        'userDetail.name',

        'tutorDetail.id',
        'tutorDetail.name'
      ]);
    if (keyword && keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'contactUs.query LIKE :keyword OR account.phoneNumber LIKE :keyword OR userDetail.name LIKE :keyword OR tutorDetail.name LIKE :keyword',
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
}
