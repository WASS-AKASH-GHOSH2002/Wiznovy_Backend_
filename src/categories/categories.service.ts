import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryPginationDto, CreateCategoryDto, UpdateCategoryStatusDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Brackets, Not, Repository } from 'typeorm';
import { DefaultStatus } from 'src/enum';

@Injectable()
export class CategoriesService {

  @InjectRepository(Category)
  private readonly repo: Repository<Category>

  
  async create(createCategoryDto: CreateCategoryDto) {
    const category = await this.repo.findOne({
      where: {
        name: createCategoryDto.name
      }
    });
    if (category) {
      throw new Error('Category already exists');
    }

    return this.repo.save(createCategoryDto);
    
  }

  async findAll(dto:CategoryPginationDto ) {
   const query=this.repo.createQueryBuilder('category')
   .select([
    'category.id',
     'category.name', 
     'category.status',
      'category.image',
       'category.imagePath'
      ])
     .where('category.status = :status', { status: dto.status })
   if(dto.keyword){
    query.andWhere(
      new Brackets((qb) => {
        qb.where('category.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
      }),
    );
  }
    
 const [result, total] = await query
   
   .orderBy('category.name', 'ASC')
   .skip(dto.offset)
   .take(dto.limit)
   .getManyAndCount();
   return {result,total}
  }


async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('category')
      .where('category.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('category.name', 'ASC')
      .getManyAndCount();
    return { result, total };
  }
  async findOne(id: string) {
    const category = await this.repo.findOne({where:{id}})
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
   
  }

  async update(id: string, dto: UpdateCategoryDto) {
  const category = await this.repo.findOne({ where: { id } });
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  if (dto.name) {
    const existingCategory = await this.repo.findOne({
      where: { name: dto.name, id: Not(id) },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }
  }

  Object.assign(category, dto);
  return this.repo.save(category);
}
    
async updateStatus(id: string, dto: UpdateCategoryStatusDto) {
  const category = await this.repo.findOne({ where: { id } });
  if (!category) {
    throw new NotFoundException('Category not found');
  }

  Object.assign(category, dto);
  return this.repo.save(category);
}
  

  async remove(id:string) {
    const category = this.repo.findOne({where:{id}})
    if (!category) {
      throw new Error('Category not found');
    }
    await this.repo.softDelete(id);

    return {message: 'Category deleted successfully', };
  }
}
