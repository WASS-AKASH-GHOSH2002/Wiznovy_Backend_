import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { CountryPaginationDto, CountryStatusDto, CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class CountryService {

  constructor(
    @InjectRepository (Country) private readonly repo:Repository<Country>
  ){}
 async create(dto: CreateCountryDto) {
 
  const existingCountry = await this.repo.findOne({
    where: { name: dto.name,code:dto.code }
  });

  if (existingCountry) {
    throw new ConflictException('Country already exists');
  }

  return this.repo.save(dto);
}

  async findAll(dto: CountryPaginationDto) {
  const query = this.repo
    .createQueryBuilder('country')
    .select([
      'country.id',
       'country.name', 
       'country.status', 
       'country.code',
       'country.imageUrl',
       'country.imagePath',
       'country.createdAt',
       'country.updatedAt'
       ]);

  if (dto.keyword) {
    query.andWhere(
      new Brackets((qb) => {
        qb.where('country.name LIKE :keyword', {
          keyword: `%${dto.keyword}%`,
        })
      }),
    );
  }

  if (dto.status) {
    query.andWhere('country.status = :status', { status: dto.status });
  } 
  const [result, total] = await query
    .skip(dto.offset)
    .take(dto.limit)
    .orderBy('country.name', 'ASC')
    .getManyAndCount();

  return { total, result };
}

 async findByUser() {
  const [result, total] = await this.repo
    .createQueryBuilder('country')
    .where('country.status = :status', { status: DefaultStatus.ACTIVE })
    .orderBy('country.name', 'ASC')
    .getManyAndCount();
  return { result, total };
}

async findOne(id: string) {
  const result = await this.repo.findOne({ where: { id } });
  if (!result) {
    throw new NotFoundException('Country Not Found');
  }
  return result;
}

async update(id: string, dto: UpdateCountryDto) {
  if (dto.name || dto.code) {
    const existingCountry = await this.repo.findOne({
      where: [
        { name: dto.name, id: Not(id) },
        { code: dto.code, id: Not(id) },
      ],
    });

    if (existingCountry) {
      throw new ConflictException('Country with this name or code already exists');
    }
  }

  await this.repo.update(id, dto);
  return this.repo.findOne({ where: { id } });
}

async updateStatus(id: string, dto: CountryStatusDto) {
  const result = await this.findOne(id);
  const obj = Object.assign(result, dto);
  return this.repo.save(obj);
}

async remove(id: string) {
  const result = await this.findOne(id);
  await this.repo.remove(result);
  return { message: 'Country deleted successfully' };
}

async uploadImage(imagePath: string, country: Country) {
  if (country.imagePath) {
    const oldPath = join(__dirname, '..', '..', country.imagePath);
    try {
      await unlink(oldPath);
    } catch (err) {
      console.warn(`Failed to delete old image: ${oldPath}`, err.message);
    }
  }
  
  country.imageUrl = process.env.WIZNOVY_CDN_LINK + imagePath.replace(/\\/g, '/');
  country.imagePath = imagePath;
  
  return this.repo.save(country);
}
}
