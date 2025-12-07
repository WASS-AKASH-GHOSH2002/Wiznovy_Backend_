import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateWalkThroughDto,
  UpdateWalkThroughDto,
  WalkThroughStatusDto,
  WalkThroughPaginationDto,
} from './dto/create-walk-through.dto';
import { WalkThrough } from './entities/walk-through.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class WalkThroughService {
  constructor(
    @InjectRepository(WalkThrough)
    private readonly repo: Repository<WalkThrough>,
  ) {}

  async create(dto: CreateWalkThroughDto, image?: string) {
    const obj = Object.assign(dto, {
      image: image ? process.env.WIZNOVY_CDN_LINK + image : null,
      imagePath: image || null,
    });
    return this.repo.save(obj);
  }

  async findAll(dto: WalkThroughPaginationDto) {
    const query = this.repo.createQueryBuilder('walkthrough');
    
    if (dto.status) {
      query.where('walkthrough.status = :status', { status: dto.status });
    }
    
    if (dto.keyword) {
      query.andWhere(
        'walkthrough.title LIKE :keyword OR walkthrough.subtitle LIKE :keyword',
        { keyword: `%${dto.keyword}%` }
      );
    }

    const [result, total] = await query
      .orderBy('walkthrough.createdAt', 'DESC')
      .take(dto.limit)
      .skip(dto.offset)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('walkthrough')
      .where('walkthrough.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('walkthrough.createdAt', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('WalkThrough Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateWalkThroughDto) {
    return this.updateEntity(id, dto);
  }

  async updateImage(id: string, image: string) {
    const result = await this.findOne(id);
    
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    
    const obj = Object.assign(result, {
      image: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
    });
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: WalkThroughStatusDto) {
    return this.updateEntity(id, dto);
  }

  private async updateEntity(id: string, dto: any) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    
    if (result.imagePath) {
      const imagePath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(imagePath);
      } catch (err) {
        console.warn(`Failed to delete image: ${imagePath}`, err.message);
      }
    }
    
    await this.repo.remove(result);
    return { message: 'WalkThrough deleted successfully' };
  }
}
