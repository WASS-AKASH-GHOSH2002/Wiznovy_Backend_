import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateQualificationDto, QualificationPaginationDto, QualificationStatusDto, BulkQualificationStatusDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { Qualification } from './entities/qualification.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class QualificationService {
  constructor(
    @InjectRepository(Qualification)
    private readonly repo: Repository<Qualification>,
  ) {}

  async create(dto: CreateQualificationDto) {
    const existingQualification = await this.repo.findOne({
      where: { name: dto.name }
    });

    if (existingQualification) {
      throw new ConflictException('Qualification with this name already exists');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: QualificationPaginationDto) {
    const query = this.repo
      .createQueryBuilder('qualification')
      .select(['qualification.id', 'qualification.name', 'qualification.status','qualification.createdAt',
        'qualification.updatedAt'
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('qualification.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          })
        }),
      );
    }

    if (dto.status) {
      query.andWhere('qualification.status = :status', { status: dto.status });
    }

    const [result, total] = await query
      .orderBy('qualification.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

 
  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('qualification')
      .where('qualification.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('qualification.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Qualification Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateQualificationDto) {
    
    if (dto.name) {
      const existingQualification = await this.repo.findOne({
        where: {
          name: dto.name,
          id: Not(id)
        }
      });

      if (existingQualification) {
        throw new ConflictException('Qualification with this name already exists');
      }
    }

    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: QualificationStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Qualification deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkQualificationStatusDto) {
    await this.repo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} qualifications status updated successfully` };
  }
}
