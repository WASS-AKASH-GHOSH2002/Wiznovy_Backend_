import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateGoalDto, GoalPaginationDto, GoalStatusDto, BulkGoalStatusDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, Not } from 'typeorm';
import { Goal } from './entities/goal.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly repo: Repository<Goal>,
  ) {}

  async create(dto: CreateGoalDto) {
    const existingGoal = await this.repo.findOne({
      where: { name: dto.name }
    });

    if (existingGoal) {
      throw new ConflictException('Goal with this name already exists');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: GoalPaginationDto) {
    const query = this.repo
      .createQueryBuilder('goal')
      .select([
        'goal.id', 
        'goal.name',
         'goal.status',
         'goal.createdAt',
         'goal.updatedAt'

      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('goal.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          })
        }),
      );
    }

    if (dto.status) {
      query.andWhere('goal.status = :status', { status: dto.status });
    } 
    const [result, total] = await query
      .orderBy('goal.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('goal')
      .where('goal.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('goal.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Goal Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateGoalDto) {
    
    if (dto.name) {
      const existingGoal = await this.repo.findOne({
        where: {
          name: dto.name,
          id: Not(id)
        }
      });

      if (existingGoal) {
        throw new ConflictException('Goal with this name already exists');
      }
    }

    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: GoalStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'Goal deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkGoalStatusDto) {
    await this.repo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} goals status updated successfully` };
  }
}