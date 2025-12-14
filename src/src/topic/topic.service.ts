import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  CreateTopicDto,
  UpdateTopicDto,
  TopicStatusDto,
  TopicPaginationDto,
} from './dto/create-topic.dto';
import { Topic } from './entities/topic.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic)
    private readonly repo: Repository<Topic>,
  ) {}

  async create(dto: CreateTopicDto) {
    
    const existingTopic = await this.repo.findOne({
      where: { name: dto.name }
    });

    if (existingTopic) {
      throw new ConflictException('Topic with this name already exists');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: TopicPaginationDto) {
    const query = this.repo
      .createQueryBuilder('topic')
      .select(['topic.id', 'topic.name', 'topic.status', 'topic.description']);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('topic.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          }).orWhere('topic.description LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          });
        }),
      );
    }

    if (dto.status) {
      query.andWhere('topic.status = :status', { status: dto.status });
    } else {
      query.andWhere('topic.status = :status', { status: DefaultStatus.ACTIVE });
    }

    const [result, total] = await query
      .orderBy('topic.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('topic')
      .where('topic.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('topic.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Topic Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateTopicDto) {
    if (dto.name) {
      const existingTopic = await this.repo.findOne({
        where: {
          name: dto.name,
          id: Not(id)
        }
      });

      if (existingTopic) {
        throw new ConflictException('Topic with this name already exists');
      }
    }

    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: TopicStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Topic deleted successfully' };
  }
}