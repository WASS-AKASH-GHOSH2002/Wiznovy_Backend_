import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BoolStatusDto } from 'src/common/dto/bool-status.dto';
import { Brackets, Repository } from 'typeorm';
import {
  FeedbackPaginationDto,
  RatingFeedbackDto,
} from './dto/rating-feedback.dto';
import { RatingFeedback } from './entities/rating-feedback.entity';

@Injectable()
export class RatingFeedbackService {
  constructor(
    @InjectRepository(RatingFeedback)
    private readonly repo: Repository<RatingFeedback>,
  ) { }

  async create(dto: RatingFeedbackDto) {
    const feedBackCnt = await this.repo.count({
      where: { accountId: dto.accountId },
    });
    if (feedBackCnt > 5) {
      throw new NotAcceptableException('Only 5 ratings allowed from a user!');
    }
    const obj = Object.create(dto);
    return this.repo.save(obj);
  }

  async findAll(
    limit: number,
    offset: number,
    keyword: string,
    status: boolean,
  ) {
    const [result, total] = await this.repo
      .createQueryBuilder('ratingFeedback')
      .leftJoinAndSelect('ratingFeedback.account', 'account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .select([
        'ratingFeedback.id',
        'ratingFeedback.desc',
        'ratingFeedback.rating',
        'ratingFeedback.status',

        'account.id',
        'account.email',

        'userDetail.id',
        'userDetail.name',
      ])
      .where('ratingFeedback.status = :status', { status: status })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'ratingFeedback.desc LIKE :desc OR userDetail.name LIKE :name',
            {
              desc: `%${keyword}%`,
              name: `%${keyword}%`,
            },
          );
        }),
      )
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { result, total };
  }

  async find() {
    const [result, total] = await this.repo
      .createQueryBuilder('ratingFeedback')
      .leftJoinAndSelect('ratingFeedback.account', 'account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .select([
        'ratingFeedback.id',
        'ratingFeedback.desc',
        'ratingFeedback.rating',
        'ratingFeedback.status',

        'account.id',

        'userDetail.id',
        'userDetail.name',
        'userDetail.profile',
      ])
      .where('ratingFeedback.status = :status', { status: true })
      .getManyAndCount();

    return { result, total };
  }

  async status(id: string, dto: BoolStatusDto) {
    const feedBack = await this.repo.findOne({ where: { id } });
    if (!feedBack) {
      throw new NotAcceptableException('Feedback not found!');
    }
    const obj = Object.assign(feedBack, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const feedBack = await this.repo.findOne({ where: { id } });
    if (!feedBack) {
      throw new NotAcceptableException('Feedback not found!');
    }
    return this.repo.remove(feedBack);
  }
}
