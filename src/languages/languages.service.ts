import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { LanguageDto, UpdateLanguageDto, LanguageStatusDto, PaginationDto, BulkLanguageStatusDto } from './dto/language.dto';
import { Language } from './entities/language.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language) private readonly repo: Repository<Language>,
  ) {}

  async create(dto: LanguageDto) {
    const existing = await this.repo
      .createQueryBuilder('l')
      .where('LOWER(l.name) = LOWER(:name)', { name: dto.name })
      .getOne();
    if (existing) throw new ConflictException('Language already exists');
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
      const existing = await this.repo
        .createQueryBuilder('l')
        .where('LOWER(l.name) = LOWER(:name)', { name: dto.name })
        .andWhere('l.id != :id', { id })
        .getOne();
      if (existing) throw new ConflictException('Language with this name already exists');
    }
    const result = await this.findOne(id);
    return this.repo.save(Object.assign(result, dto));
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
    await this.repo.update({ id: In(dto.ids) }, { status: dto.status });
    return { message: `${dto.ids.length} languages status updated successfully` };
  }
}
