import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { LanguageDto, UpdateLanguageDto, LanguageStatusDto, PaginationDto, BulkLanguageStatusDto } from './dto/language.dto';
import { Language } from './entities/language.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language) private readonly repo: Repository<Language>,
  ) {}

  async create(dto: LanguageDto) {
    const existingLanguage = await this.repo.findOne({
      where: { name: dto.name },
    });
    if (existingLanguage) {
      throw new ConflictException('Language already exists');
    }
    return this.repo.save(dto);
  }

  async findAll(dto: PaginationDto) {
    const query = this.repo
      .createQueryBuilder('language')
      .select([
        'language.id',
        'language.name',
        'language.status',
        'language.createdAt',
        'language.updatedAt'
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('language.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          })
        }),
      );
    }

    if (dto.status) {
      query.andWhere('language.status = :status', { status: dto.status });
    }
    
    const [result, total] = await query
      .skip(dto.offset)
      .take(dto.limit)
      .orderBy('language.name', 'ASC')
      .getManyAndCount();

    return { total, result };
  }
  
  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('language')
      .where('language.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('language.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Language Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateLanguageDto) {
    if (dto.name) {
      const existingLanguage = await this.repo.findOne({
        where: { name: dto.name },
      });

      if (existingLanguage && existingLanguage.id !== id) {
        throw new ConflictException('Language with this name already exists');
      }
    }

    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, dto: LanguageStatusDto) {
    const result = await this.findOne(id);
    const obj = { ...result, ...dto };
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Language deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkLanguageStatusDto) {
    console.log('Bulk update - Received IDs:', dto.ids);
    console.log('Bulk update - Status:', dto.status);
    
    try {
      for (const id of dto.ids) {
        await this.repo.update({ id }, { status: dto.status });
      }
      console.log('Bulk update - Success');
      return { message: `${dto.ids.length} languages status updated successfully` };
    } catch (error) {
      console.error('Bulk update - Error:', error);
      throw error;
    }
  }
}
