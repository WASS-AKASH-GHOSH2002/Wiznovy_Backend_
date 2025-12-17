import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Course } from 'src/course/entities/course.entity';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';
import { StudyMaterial } from 'src/study-material/entities/study-material.entity';
import { CreateUnitDto, UpdateUnitDto, UnitPaginationDto } from './dto/create-unit.dto';
import { AddContentToUnitDto } from './dto/unit-content.dto';
import { AccessTypes, PurchaseType } from 'src/enum';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';


@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(VideoLecture)
    private readonly videoRepo: Repository<VideoLecture>,
    @InjectRepository(StudyMaterial)
    private readonly studyRepo: Repository<StudyMaterial>,
  ) { }

  async create(dto: CreateUnitDto, image?: string) {
    if (!dto.courseId) {
      throw new NotFoundException('courseId must be provided');
    }
    
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    const existingUnit = await this.repo.findOne({ where: { name: dto.name, courseId: dto.courseId } });
    if (existingUnit) {
      throw new ConflictException('Unit with this name already exists in the course');
    }
    
    const obj = Object.assign(dto);
    if (image) {
      obj.imgUrl = process.env.WIZNOVY_CDN_LINK + image;
      obj.imgPath = image;
    }
    return this.repo.save(obj);
  }

  async findAll(dto: UnitPaginationDto) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.course', 'course')
      .leftJoinAndSelect('course.subject', 'subject')
  
      .leftJoinAndSelect('unit.videoLectures', 'videoLectures')
      .leftJoinAndSelect('videoLectures.studyMaterials', 'videoLectures')
      .select([
        'unit.id',
        'unit.name',
        'unit.description',
        'unit.status',
        'unit.createdAt',

        'course.id',
        'course.name',
        
        'subject.id',
        'subject.name',

        'videoLectures.id',
        'videoLectures.title',
        'videoLectures.duration',
        'videoLectures.videoUrl',
        'videoLectures.accessTypes',
        'videoLectures.thumbnailUrl',
        'videoLectures.thumbnailPath',
        'videoLectures.status',

        'studyMaterials.id',
        'studyMaterials.title',
        'studyMaterials.description',
        'studyMaterials.fileUrl',
        'studyMaterials.filePath',
        'studyMaterials.status',
      ]);

    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unit.name LIKE :keyword', {
            keyword: '%' + keyword + '%',
          });
        }),
      );
    }

 

    if (dto.courseId) {
      queryBuilder.andWhere('unit.courseId = :courseId', { courseId: dto.courseId });
    }

    if (dto.status) {
      queryBuilder.andWhere('unit.status = :status', { status: dto.status });
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'unit.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async getUnitsByCourse(dto: UnitPaginationDto) {
    if (!dto.courseId) {
      throw new ConflictException('courseId is required');
    }

    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const queryBuilder = this.repo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.course', 'course')
      .select([
        'unit.id',
        'unit.name',
        'unit.description',
        'unit.imgUrl',
        'unit.status',
        'unit.createdAt',
        'course.id',
        'course.name',
      ])
      .where('unit.courseId = :courseId', { courseId: dto.courseId });

    if (dto.keyword) {
      queryBuilder.andWhere('unit.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
    }

    if (dto.status) {
      queryBuilder.andWhere('unit.status = :status', { status: dto.status });
    }

    const [result, total] = await queryBuilder
      .orderBy('unit.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async findByUser(dto: UnitPaginationDto) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.course', 'course')
      .select([
        'unit.id',
        'unit.name',
        'unit.description',
        'unit.imgUrl',
        'unit.imgPath',
        'unit.status',
        'unit.createdAt',

        'course.id',
        'course.name',

        
      ])
      .where('unit.status = :status', { status: 'Active' });
    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('unit.name LIKE :keyword', {
            keyword: '%' + keyword + '%',
          });
        }),
      );
    }

   
    if (dto.courseId) {
      queryBuilder.andWhere('unit.courseId = :courseId', { courseId: dto.courseId });
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'unit.createdAt': 'DESC' })
      .getManyAndCount();
    return { result, total };
  }

  async getUserUnitsByCourse(dto: UnitPaginationDto) {
    if (!dto.courseId) {
      throw new ConflictException('courseId is required');
    }

    const queryBuilder = this.repo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.course', 'course')
      .select([
        'unit.id',
        'unit.name',
        'unit.description',
        'unit.imgUrl',
        'unit.status',
        'unit.createdAt',
        'course.id',
        'course.name',
      ])
      .where('unit.courseId = :courseId AND unit.status = :status', { 
        courseId: dto.courseId, 
        status: 'Active' 
      });

    if (dto.keyword) {
      queryBuilder.andWhere('unit.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
    }

    const [result, total] = await queryBuilder
      .orderBy('unit.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string, userId?: string) {
    const unit = await this.repo.findOne({
      where: { id },
      relations: ['videoLectures', 'studyMaterials']
    });
    if (!unit) {
      throw new NotFoundException('Unit not found!');
    }

    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Unit not found!');
    }
    Object.assign(result, dto);
    return this.repo.save(result);
  }



  async image(image: string, result: Unit) {
    if (result.imgPath) {
      const oldPath = join(__dirname, '..', '..', result.imgPath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old image: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      imgUrl: process.env.WIZNOVY_CDN_LINK + image,
      imgPath: image,
    });
    return this.repo.save(obj);
  }

  async updateStatus(id: string, dto: UpdateUnitDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Unit not found!');
    }
    Object.assign(result, dto);
    return this.repo.save(result);
  }
}