import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StatePaginationDto, StateStatusDto, CreateStateDto, UpdateStateDto, BulkStateStatusDto } from './dto/create-state.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { State } from './entities/state.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class StateService {
  constructor(
    @InjectRepository(State) private readonly repo: Repository<State>
  ) {}

  async create(dto: CreateStateDto) {
    const existingState = await this.repo.findOne({
      where: { name: dto.name, countryId: dto.countryId, }
    });

    if (existingState) {
      throw new ConflictException('State already exists in this country');
    }

    return this.repo.save(dto);
  }

  async findAll(dto: StatePaginationDto) {
    const query = this.repo
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.country', 'country')
      .select([
        'state.id',
        'state.name',
        'state.code',
        'state.status',
        'state.createdAt',
        'state.updatedAt',
        'country.id',
        'country.name'
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('state.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          });
        }),
      );
    }

    if (dto.countryId) {
      query.andWhere('state.countryId = :countryId', { countryId: dto.countryId });
    }

    if (dto.status) {
      query.andWhere('state.status = :status', { status: dto.status });
    } 

    const [result, total] = await query
      .skip(dto.offset)
      .take(dto.limit)
      .orderBy('state.name', 'ASC')
      .getManyAndCount();

    return { total, result };
  }

  async findByUser(countryId?: string) {
    const query = this.repo
      .createQueryBuilder('state')
      .where('state.status = :status', { status: DefaultStatus.ACTIVE });

    if (countryId) {
      query.andWhere('state.countryId = :countryId', { countryId });
    }

    const [result, total] = await query
      .orderBy('state.name', 'ASC')
      .getManyAndCount();

    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ 
      where: { id },
      relations: ['country']
    });
    if (!result) {
      throw new NotFoundException('State Not Found');
    }
    return result;
  }

  async update(id: string, dto: UpdateStateDto) {
    if (dto.name) {
      const existingState = await this.repo.findOne({
        where: { 
          name: dto.name, 
          countryId: dto.countryId || undefined,
          id: Not(id) 
        },
      });

      if (existingState) {
        throw new ConflictException('State with this name already exists in this country');
      }
    }

    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: string, dto: StateStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: string) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'State deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkStateStatusDto) {
    await this.repo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} states status updated successfully` };
  }
}