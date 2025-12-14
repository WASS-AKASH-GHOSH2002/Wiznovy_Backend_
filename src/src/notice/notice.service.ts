import { Injectable, NotFoundException } from '@nestjs/common';
import { Notice } from './entities/notice.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import { DefaultStatusPaginationDto } from 'src/common/dto/default-status-pagination.dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly repo: Repository<Notice>,
  ) {}

  async create(image: string) {
    const obj = {
      image: process.env.SWC_CDN_LINK + image,
      imagePath: image,
    };
    return this.repo.save(obj);
  }

  async findAll(dto: DefaultStatusPaginationDto) {
    const query = this.repo
      .createQueryBuilder('notice')
      .where('notice.status = :status', {
        status: dto.status,
      });
    const [result, total] = await query
      .orderBy({ 'notice.createdAt': 'DESC' })
      .take(dto.limit)
      .skip(dto.offset)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const query = this.repo
      .createQueryBuilder('notice')
      .where('notice.status = :status', {
        status: DefaultStatus.ACTIVE,
      });
    const [result, total] = await query.getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Notice Not Found..');
    }
    return result;
  }

  async image(image: string, result: Notice) {
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = {
      ...result,
      image: process.env.SWC_CDN_LINK + image,
      imagePath: image,
    };
    return this.repo.save(obj);
  }

  async status(id: string, dto: DefaultStatusDto) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Notice Not Found..');
    }
    const obj = { ...result, ...dto };
    return this.repo.save(obj);
  }
}
