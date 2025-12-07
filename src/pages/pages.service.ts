
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UpdatePageDto, PagePaginationDto } from './dto/page.dto';
import { Page } from './entities/page.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { PageType } from 'src/enum';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page) private readonly repo: Repository<Page>,
  ) {}


  async create(image: string, dto: CreatePageDto) {
    const existingPage = await this.repo.findOne({ where: { title: dto.title, pageType: dto.pageType } });
    if (existingPage) {
      throw new ConflictException('Page with this title and type already exists');
    }
    const obj = {
      title: dto.title,
      pageType: dto.pageType,
      desc: dto.desc,
      imageUrl: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
    };
    return this.repo.save(obj);
  }

  async findAll(dto: PagePaginationDto) {
    const query = this.repo.createQueryBuilder('page');

    if (dto.pageType) {
      query.andWhere('page.pageType = :pageType', { pageType: dto.pageType });
    }

    if (dto.keyword) {
      query.andWhere('page.title LIKE :keyword', { keyword: `%${dto.keyword}%` });
    }

    const [result, total] = await query
      .orderBy('page.createdAt', 'DESC')
      .take(dto.limit)
      .skip(dto.offset)
      .getManyAndCount();

    return { result, total };
  }

  async findAllPublic() {
    return this.repo.find();
  }

  async findByType(pageType: string) {
    if (!pageType) {
      throw new NotFoundException('Page type is required');
    }
    return this.repo.find({ where: { pageType: pageType as PageType } });
  }

  async findOne(id: number) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Page Not Found..');
    }
    return result;
  }

  async image(image: string, result: Page) {
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      imageUrl: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
    });
    return this.repo.save(obj);
  }

  async update(id: number, dto: UpdatePageDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Page Not Found..');
    }
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: number) {
    const page = await this.findOne(id);
    if (page.imagePath) {
      const filePath = join(__dirname, '..', '..', page.imagePath);
      try {
        await unlink(filePath);
      } catch (err) {
        console.warn(`Failed to delete image: ${filePath}`, err?.message || err);
      }
    }

    await this.repo.delete(id);
    return { message: 'Page deleted successfully' };
  }
}