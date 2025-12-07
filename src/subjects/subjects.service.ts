import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSubjectDto, SubjectPaginationDto, UpdateStatusDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { DefaultStatus } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()

export class SubjectsService {

constructor(
  @InjectRepository (Subject) private readonly repo:Repository<Subject>,
  @InjectRepository (TutorDetail) private readonly tutorRepo:Repository<TutorDetail>,

)
{}
 async create(createSubjectDto: CreateSubjectDto) {
  const existingSubject = await this.repo.findOne(
    {
      where: {
        name: createSubjectDto.name
      }
    }
  )

  if (existingSubject) {
    throw new ConflictException('Subject with this name already exists')
  }

return this.repo.save(createSubjectDto)

  }

   async findAll(dto:SubjectPaginationDto) {
    const query = this.repo.createQueryBuilder('subject')
    .select(
      [
        'subject.id',
        'subject.name',
        'subject.description',
        'subject.image',
        'subject.imagePath',
        'subject.status',
        'subject.createdAt',
        'subject.updatedAt'
      ]
    )
    if (dto.keyword) {
         query.andWhere(
              new Brackets((qb) => {
                qb.where('subject.name LIKE :keyword', {
                  keyword: `%${dto.keyword}%`,
                });
              }
              )
            )}
    
      if (dto.status) {
          query.andWhere('subject.status = :status', { status: dto.status });
        } else {
          query.andWhere('subject.status = :status', { status: DefaultStatus.ACTIVE });
        }

 const [result, total] = await query
      .orderBy('subject.name', 'ASC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }


    
  

  async findByUser() {
    const [result, total] = await this.repo
      .createQueryBuilder('subject')
      .where('subject.status = :status', { status: DefaultStatus.ACTIVE })
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const subject = await this.repo.findOne({
      where: {
        id

    }})
    if (!subject) {
      throw new ConflictException('Subject not found')
    }
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.repo.findOne({
      where: {
        id
      }
    })
    if (!subject) {
      throw new ConflictException('Subject not found')
    }
    const obj = Object.assign(subject, updateSubjectDto)
    
    return this.repo.save(obj)
  }

   async updateStatus(id: string, dto:UpdateStatusDto) {
      const result = await this.findOne(id);
      if (!result) {
        throw new ConflictException('Subject not found');
      }
      const obj = Object.assign(result, dto);
      return this.repo.save(obj);
    }

  async image(image: string, result: Subject) {
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
  const subject = await this.repo.findOne({
    where: { id },
  });

  if (!subject) {
    throw new ConflictException('Subject not found');
  }

  await this.repo.remove(subject);
  return { message: 'Subject deleted successfully' };
}

async getSubjectsWithTutorCount() {
  const tutorCounts = await this.tutorRepo
    .createQueryBuilder('tutor')
    .leftJoin('tutor.account', 'account')
    .select('tutor.subjectId', 'subjectId')
    .addSelect('COUNT(tutor.id)', 'tutorCount')
    .where('account.status = :status', { status: DefaultStatus.ACTIVE })
    .groupBy('tutor.subjectId')
    .getRawMany();

  const subjects = await this.repo
    .createQueryBuilder('subject')
    .select(['subject.id', 'subject.name', 'subject.image', 'subject.imagePath'])
    .where('subject.status = :status', { status: DefaultStatus.ACTIVE })
    .getMany();

  return subjects.map((subject) => {
    const tutorCount = tutorCounts.find((t) => t.subjectId === subject.id);
    return {
      id: subject.id,
      name: subject.name,
      image: subject.image,
      imagePath: subject.imagePath,
      tutorCount: Number(tutorCount?.tutorCount || 0)
    };
  });
}

}
