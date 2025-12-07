import { ConflictException, Injectable } from '@nestjs/common';
import { CreateClassDto, ClassPaginationDto, UpdateStatusDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { DefaultStatus } from 'src/enum';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ClassService {

constructor(
  @InjectRepository (Class) private readonly repo:Repository<Class>,
)
{}
 async create(createClassDto: CreateClassDto) {
  const existingClass = await this.repo.findOne(
    {
      where: {
        name: createClassDto.name
      }
    }
  )

  if (existingClass) {
    throw new ConflictException('Class with this name already exists')
  }

return this.repo.save(createClassDto)

  }

   async findAll(dto:ClassPaginationDto) {
    const query = this.repo.createQueryBuilder('class')
    .select(
      [
        'class.id',
        'class.name',
        'class.description',
        'class.status',
        'class.createdAt',
        'class.updatedAt'
      ]
    )
    if (dto.keyword) {
         query.andWhere(
              new Brackets((qb) => {
                qb.where('class.name LIKE :keyword', {
                  keyword: `%${dto.keyword}%`,
                });
              }
              )
            )}
    
      if (dto.status) {
          query.andWhere('class.status = :status', { status: dto.status });
        } else {
          query.andWhere('class.status = :status', { status: DefaultStatus.ACTIVE });
        }

 const [result, total] = await query
      .orderBy('class.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('class')
      .where('class.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('class.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const classData = await this.repo.findOne({
      where: {
        id

    }})
    if (!classData) {
      throw new ConflictException('Class not found')
    }
    return classData;
  }

  update(id: string, updateClassDto: UpdateClassDto) {
    const classData = this.repo.findOne({
      where: {
        id
      }
    })
    if (!classData) {
      throw new ConflictException('Class not found')
    }
    const obj = Object.assign(classData, updateClassDto)
    
    return this.repo.save(obj)
  }

   async updateStatus(id: string, dto:UpdateStatusDto) {
      const result = await this.findOne(id);
      if (!result) {
        throw new ConflictException('Class not found');
      }
      const obj = Object.assign(result, dto);
      return this.repo.save(obj);
    }

  async image(image: string, result: Class) {
    if (result.imagePath) {
      const oldPath = join(__dirname, '..', '..', result.imagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      image: process.env.WIZNOVY_CDN_LINK + image,
      imagePath: image,
    });
    return this.repo.save(obj);
  }

async remove(id: string) {
  const classData = await this.repo.findOne({
    where: { id },
  });

  if (!classData) {
    throw new ConflictException('Class not found');
  }

  await this.repo.remove(classData);
  return { message: 'Class deleted successfully' };
}

}
