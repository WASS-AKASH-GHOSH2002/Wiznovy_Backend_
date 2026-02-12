import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Not, Repository } from 'typeorm';
import { CreateCityDto, UpdateCityDto, CityPaginationDto, CityStatusDto, BulkCityStatusDto } from './dto/create-city.dto';
import { City } from './entities/city.entity';
import { State } from 'src/state/entities/state.entity';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly repo: Repository<City>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
  ) {}

  async create(dto: CreateCityDto) {
    if (dto.stateId) {
      const state = await this.stateRepo.findOne({ where: { id: dto.stateId } });
      if (!state) {
        throw new ConflictException('State not found with provided stateId');
      }
    }
    
    const existingCity = await this.repo.findOne({
      where: { name: dto.name, stateId: dto.stateId },
    });
    if (existingCity) {
      throw new ConflictException('City already exists in this state!');
    }
    return this.repo.save(dto);
  }

  async findAll(dto: CityPaginationDto) {
    const query = this.repo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.state', 'state')
      .select([
        'city.id',
        'city.name',
        'city.status',
        'city.createdAt',
        'city.updatedAt',
        'state.id',
        'state.name'
      ]);

    if (dto.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('city.name LIKE :keyword', {
            keyword: `%${dto.keyword}%`,
          });
        }),
      );
    }

    if (dto.stateId) {
      query.andWhere('city.stateId = :stateId', { stateId: dto.stateId });
    }

    if (dto.status) {
      query.andWhere('city.status = :status', { status: dto.status });
    } 

    const [result, total] = await query
      .skip(dto.offset)
      .take(dto.limit)
      .orderBy('city.name', 'ASC')
      .getManyAndCount();

    return { total, result };
  }

  async findByUser(stateId?: string) {
    const query = this.repo
      .createQueryBuilder('city')
      .where('city.status = :status', { status: DefaultStatus.ACTIVE });

    if (stateId) {
      query.andWhere('city.stateId = :stateId', { stateId });
    }

    const [result, total] = await query
      .orderBy('city.name', 'ASC')
      .getManyAndCount();

    return { result, total };
  }



  async findOne(id: number) {
    const result = await this.repo.findOne({ 
      where: { id },
      relations: ['state']
    });
    if (!result) {
      throw new NotFoundException('City Not Found');
    }
    return result;
  }

  async update(id: number, dto: UpdateCityDto) {
    if (dto.stateId) {
      const state = await this.stateRepo.findOne({ where: { id: dto.stateId } });
      if (!state) {
        throw new ConflictException('State not found with provided stateId');
      }
    }
    
    if (dto.name) {
      const existingCity = await this.repo.findOne({
        where: { 
          name: dto.name, 
          stateId: dto.stateId || undefined,
          id: Not(id) 
        },
      });

      if (existingCity) {
        throw new ConflictException('City with this name already exists in this state');
      }
    }

    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: number, dto: CityStatusDto) {
    const result = await this.findOne(id);
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async remove(id: number) {
    const result = await this.findOne(id);
    await this.repo.remove(result);
    return { message: 'City deleted successfully' };
  }

  async bulkUpdateStatus(dto: BulkCityStatusDto) {
    await this.repo.update(dto.ids, { status: dto.status });
    return { message: `${dto.ids.length} cities status updated successfully` };
  }
}
