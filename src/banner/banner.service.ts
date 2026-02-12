import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    // if (dto.status === DefaultStatus.ACTIVE) {
    //   // const activeCount = await this.repo.count({
    //   //   where: {
    //   //     bannerType: dto.bannerType,
    //   //     status: DefaultStatus.ACTIVE
    //   //   }
    //   // });
      
    //   // if (activeCount >= 3) {
    //   //   throw new NotFoundException(`Maximum 3 active banners allowed for ${dto.bannerType}`);
    //   // }
    //  }
    
    const obj = {image: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
      bannerType: dto.bannerType,
      //status: dto.status || DefaultStatus.PENDING,
    };
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

    if (dto.keyword) {
    query.andWhere(
      `(banner.bannerType LIKE :keyword OR banner.status LIKE :keyword)`,
      { keyword: `%${dto.keyword}%` },
    );
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

  const status = DefaultStatus.ACTIVE;
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
  const result = await this.repo.findOne({ where: { id } });

  if (!result) {
    throw new NotFoundException('Banner Not Found');
  }


  if (
    dto.status === DefaultStatus.ACTIVE &&
    result.status !== DefaultStatus.ACTIVE
  ) {
    const activeCount = await this.repo.count({
      where: {
        bannerType: result.bannerType,
        status: DefaultStatus.ACTIVE,
      },
    });

    if (activeCount >= 3) {
      throw new BadRequestException(
        `Maximum 3 active banners allowed for ${result.bannerType}`
      );
    }
  }

  result.status = dto.status;

  return await this.repo.save(result);
}


  async type(id: string, dto: BannerDto) {
    const result = await this.repo.findOne({ where: { id: id } });
    if (!result) {
      throw new NotFoundException('Banner Not Found..');
    }
    
    if (result.status === DefaultStatus.ACTIVE && result.bannerType !== dto.bannerType) {
      const activeCount = await this.repo.count({
        where: {
          bannerType: dto.bannerType,
          status: DefaultStatus.ACTIVE
        }
      });
      
      if (activeCount >= 3) {
        throw new BadRequestException(`Maximum 3 active banners allowed for ${dto.bannerType}`);
      }
    }
    
    result.bannerType = dto.bannerType;
    return this.repo.save(result);
  }


}
