import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Designation } from './entities/designation.entity';
import { CreateDesignationDto, UpdateDesignationDto, DesignationStatusDto, DesignationPaginationDto, BulkDesignationStatusDto } from './dto/create-designation.dto';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(Designation)
    private readonly repo: Repository<Designation>,
  ) {}

  async create(dto: CreateDesignationDto) {
    const existing = await this.repo
      .createQueryBuilder('d')
      .where('LOWER(d.name) = LOWER(:name)', { name: dto.name })
      .getOne();
    if (existing) throw new ConflictException('Designation with this name already exists');
    return this.repo.save(dto);
  }

  async findAll(dto: DesignationPaginationDto) {
    const query = this.repo
      .createQueryBuilder('designation')
      .select([
        'designation.id',
        'designation.name',
        'designation.status',
        'designation.createdAt',
        'designation.updatedAt',
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('designation.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
        }),
      );
    }

    if (dto.status) {
      query.andWhere('designation.status = :status', { status: dto.status });
    }

    const [result, total] = await query
      .orderBy('designation.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('designation')
      .where('designation.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('designation.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Designation Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateDesignationDto) {
    if (dto.name) {
      const existing = await this.repo
        .createQueryBuilder('d')
        .where('LOWER(d.name) = LOWER(:name)', { name: dto.name })
        .andWhere('d.id != :id', { id })
        .getOne();
      if (existing) throw new ConflictException('Designation with this name already exists');
    }
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: DesignationStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Designation deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkDesignationStatusDto) {
    await this.repo.update({ id: In(dto.ids) }, { status: dto.status });
    return { message: `${dto.ids.length} designations status updated successfully` };
  }
}
