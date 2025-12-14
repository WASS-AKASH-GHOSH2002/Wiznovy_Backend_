import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import { DefaultStatus } from 'src/enum';
import { Brackets, Repository } from 'typeorm';
import { FaqDto, FaqPaginationDto, UpdateFaqDto } from './dto/faq.dto';
import { Faq } from './entities/faq.entity';


@Injectable()
export class FaqsService {
  constructor(@InjectRepository(Faq) private readonly repo: Repository<Faq>) {}

  async create(dto: FaqDto) {
    const result = await this.repo.findOne({
      where: { question: dto.question },
    });
    if (result) {
      throw new ConflictException('This faq already exists!');
    }
    const obj = Object.assign(dto);
    return this.repo.save(obj);
  }

  async findAll(dto: FaqPaginationDto) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo
      .createQueryBuilder('faq')
      .where('faq.status = :status', {
        status: dto.status,
      });

    if (dto.type) {
      queryBuilder.andWhere('faq.type = :type', { type: dto.type });
    }

    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where('faq.question LIKE :question OR faq.answer LIKE :answer', {
          question: '%' + keyword + '%',
          answer: '%' + keyword + '%',
        });
      }),
    );

    const [result, total] = await queryBuilder
      .orderBy({ 'faq.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }
  
  async find() {
    const [result, total] = await this.repo
      .createQueryBuilder('faq')
      .where('faq.status = :status', {
        status: DefaultStatus.ACTIVE,
      })
      .orderBy({ 'faq.createdAt': 'DESC' })
      .getManyAndCount();

    return { result, total };
  }

  async findByType(type: 'USER' | 'TUTOR') {
    const [result, total] = await this.repo
      .createQueryBuilder('faq')
      .where('faq.status = :status AND faq.type = :type', {
        status: DefaultStatus.ACTIVE,
        type: type,
      })
      .orderBy({ 'faq.createdAt': 'DESC' })
      .getManyAndCount();

    return { result, total };
  }

  async update(id: string, dto: UpdateFaqDto) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Faq not found!');
    }
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async status(id: string, dto: DefaultStatusDto) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Faq not found!');
    }
    result.status = dto.status;
    return this.repo.save(result);
  }
}
