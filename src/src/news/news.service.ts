import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private readonly repo: Repository<News>,
  ) {}

  async create(dto: CreateNewsDto) {
    const result = await this.repo.findOne({
      where: { heading: dto.heading },
    });
    if (result) {
      throw new ConflictException('News already exists!');
    }
    const obj = Object.create(dto);
    return this.repo.save(obj);
  }

  async findAll(dto: CommonPaginationDto) {
    const keyword = dto.keyword || '';
    const [result, total] = await this.repo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.heading',
        'news.desc',
        'news.image',
        'news.createdAt',
      ])
      .andWhere(
        new Brackets((qb) => {
          qb.where('news.heading LIKE :keyword OR news.desc LIKE :keyword', {
            keyword: '%' + keyword + '%',
          });
        }),
      )
      .orderBy({ 'news.createdAt': 'DESC' })
      .take(dto.limit)
      .skip(dto.offset)
      .getManyAndCount();
    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('news')
      .select([
        'news.id',
        'news.heading',
        'news.desc',
        'news.image',
        'news.createdAt',
      ])
      .orderBy({ 'news.createdAt': 'DESC' })
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateNewsDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('News not found!');
    }
    const obj = { ...result, ...dto };
    return this.repo.save(obj);
  }

  async image(image: string, result: News) {
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      image: process.env.SWC_CDN_LINK + image,
      imagePath: image,
    });
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('News not found!');
    }
    return this.repo.remove(result);
  }
}
