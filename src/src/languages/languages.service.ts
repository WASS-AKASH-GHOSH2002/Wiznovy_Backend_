import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { LanguageDto,  UpdateLanguageDto, LanguageStatusDto, PaginationDto } from './dto/language.dto';
import { Language } from './entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language) private readonly repo: Repository<Language>,
  ) {}

  async create(dto: LanguageDto) {
    const result = await this.repo.findOne({
      where: { name: dto.name },
    });
    if (result) {
      throw new ConflictException('Language already exists!');
    }
    const obj = Object.assign(dto);
    return this.repo.save(obj);
  }

  async find(dto: PaginationDto) {
    const keyword = dto.keyword || '';
    const whereConditions: any = {
      name: Like('%' + keyword + '%'),
    };
    
    if (dto.status !== undefined) {
      whereConditions.status = dto.status;
    }
    
    const [result, total] = await this.repo.findAndCount({
      where: whereConditions,
      order: { name: 'ASC' },
      take: dto.limit,
      skip: dto.offset,
    });
    return { result, total };
  }
  
  async findByUser() {
    const [result, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
    });
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Language not found!');
    }
    return result;
  }

  async update(id: string, dto: UpdateLanguageDto) {
    const language = await this.findOne(id);
    
    if (dto.name && dto.name !== language.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Language name already exists!');
      }
    }
    
    Object.assign(language, dto);
    return this.repo.save(language);
  }

  async updateStatus(id: string, dto: LanguageStatusDto) {
    const language = await this.findOne(id);
    Object.assign(language, dto);
    return this.repo.save(language);
  }

  async remove(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Language not found!');
    }
    return this.repo.remove(result);
  }
}
