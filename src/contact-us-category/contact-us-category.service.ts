import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateContactUsCategoryDto, ContactUsCategoryPaginationDto, ContactUsCategoryStatusDto, BulkContactUsCategoryStatusDto } from './dto/create-contact-us-category.dto';
import { UpdateContactUsCategoryDto } from './dto/update-contact-us-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { ContactUsCategory } from './entities/contact-us-category.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class ContactUsCategoryService {
  constructor(
    @InjectRepository(ContactUsCategory)
    private readonly repo: Repository<ContactUsCategory>,
  ) {}

  async create(dto: CreateContactUsCategoryDto) {
    const existingCategory = await this.repo.findOne({
      where: { title: dto.title }
    });

    if (existingCategory) {
      throw new ConflictException('Category with this title already exists');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: ContactUsCategoryPaginationDto) {
    const query = this.repo
      .createQueryBuilder('contactUsCategory')
      .select([
        'contactUsCategory.id',
        'contactUsCategory.title',
        'contactUsCategory.status',
        'contactUsCategory.createdAt',
        'contactUsCategory.updatedAt'
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('contactUsCategory.title LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          })
        }),
      );
    }

    if (dto.status) {
      query.andWhere('contactUsCategory.status = :status', { status: dto.status });
    }

    const [result, total] = await query
      .orderBy('contactUsCategory.title', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('contactUsCategory')
      .where('contactUsCategory.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('contactUsCategory.title', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Contact Us Category Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateContactUsCategoryDto) {
    if (dto.title) {
      const existingCategory = await this.repo.findOne({
        where: {
          title: dto.title,
          id: Not(id)
        }
      });

      if (existingCategory) {
        throw new ConflictException('Category with this title already exists');
      }
    }

    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: ContactUsCategoryStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Contact Us Category deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkContactUsCategoryStatusDto) {
    await this.repo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} categories status updated successfully` };
  }
}
