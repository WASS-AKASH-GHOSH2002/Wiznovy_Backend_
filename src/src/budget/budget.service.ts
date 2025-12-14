import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateBudgetDto, UpdateBudgetDto, BudgetStatusDto, BudgetPaginationDto } from './dto/create-budget.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private readonly repo: Repository<Budget>,
  ) {}

  async create(dto: CreateBudgetDto) {
    const existingBudget = await this.repo.findOne({
      where: { min: dto.min, max: dto.max }
    });

    if (existingBudget) {
      throw new ConflictException('Budget with this range already exists');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: BudgetPaginationDto) {
    const query = this.repo
      .createQueryBuilder('budget')
      .select(['budget.id', 'budget.min', 'budget.max', 'budget.status', 'budget.createdAt', 'budget.updatedAt']);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('CAST(budget.min AS CHAR) LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          }).orWhere('CAST(budget.max AS CHAR) LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          });
        }),
      );
    }

    if (dto.status) {
      query.andWhere('budget.status = :status', { status: dto.status });
    } else {
      query.andWhere('budget.status = :status', { status: DefaultStatus.ACTIVE });
    }

    const [result, total] = await query
      .orderBy('budget.min', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('budget')
      .where('budget.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('budget.min', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Budget Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const budget = await this.repo.findOne({ where: { id } });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (dto.min !== undefined && dto.max !== undefined) {
      const existingBudget = await this.repo.findOne({
        where: {
          min: dto.min,
          max: dto.max,
          id: Not(id)
        }
      });

      if (existingBudget) {
        throw new ConflictException('Budget with this range already exists');
      }
    }

    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: BudgetStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Budget deleted successfully' };
  }
}