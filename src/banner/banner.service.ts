import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BannerDto,
  BannerFilterDto,
  BannerPaginationDto,
} from './dto/create-banner.dto';
import { Banner } from './entities/banner.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly repo: Repository<Banner>,
  ) {}

  async create(image: string, dto: BannerDto) {
    const obj = {image: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
      bannerType: dto.bannerType,
      status: dto.status || DefaultStatus.PENDING,};
    return this.repo.save(obj);
  }

async findAll(dto: BannerPaginationDto) {
  const query = this.repo.createQueryBuilder('banner');

  if (dto.status) {
    query.andWhere('banner.status = :status', { status: dto.status });
  }

  if (dto.bannerType) {
    query.andWhere('banner.BannerType = :BannerType', { BannerType: dto.bannerType });
  }
  const [result, total] = await query
    .orderBy('banner.createdAt', 'DESC')
    .take(dto.limit)
    .skip(dto.offset)
    .getManyAndCount();

  return { result, total };
}


  async findByUser(dto: BannerFilterDto) {
  const query = this.repo.createQueryBuilder('banner');

  const status = dto.status || DefaultStatus.ACTIVE;
  query.where('banner.status = :status', { status });

  if (dto.bannerType) {
    query.andWhere('banner.bannerType = :bannerType', { bannerType: dto.bannerType });
  }

  query.orderBy('banner.createdAt', 'DESC');

  const [result, total] = await query.getManyAndCount();
  return { result, total };
}
  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Banner Not Found..');
    }
    return result;
  }

  async image(image: string, result: Banner) {
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      image: process.env.WIZNOVY_CDN_LINK+ image,
      imagePath: image,
    });
    return this.repo.save(obj);
  }

  async status(id: string, dto: BannerDto) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Banner Not Found..');
    }
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }
}
