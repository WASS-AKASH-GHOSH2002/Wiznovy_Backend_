import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { StudyMaterial } from './entities/study-material.entity';
import { CreateStudyMaterialDto, UpdateStudyMaterialDto, StudyMaterialPaginationDto, StudyMaterialFilterDto } from './dto/create-study-material.dto';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { Subject } from 'src/subjects/entities/subject.entity';
import { Unit } from 'src/unit/entities/unit.entity';
import { Course } from 'src/course/entities/course.entity';
import { VideoLecture } from 'src/video-lecture/entities/video-lecture.entity';

@Injectable()
export class StudyMaterialService {
  constructor(
    @InjectRepository(StudyMaterial)
    private readonly repo: Repository<StudyMaterial>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(VideoLecture)
    private readonly videoLectureRepo: Repository<VideoLecture>,
    // private readonly userPurchaseService: UserPurchaseService
  ) { }

async create(dto: CreateStudyMaterialDto, pdf?: Express.Multer.File, thumbnail?: Express.Multer.File) {
  let validVideoLectureId = null;
  
  if (dto.videoLectureId) {
    const videoLecture = await this.videoLectureRepo.findOne({
      where: { id: dto.videoLectureId },
      relations: ['unit'],
    });
    if (videoLecture) {
      validVideoLectureId = dto.videoLectureId;
    }
  }

  if (dto.unitId) {
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId } });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
  }

  const materialData: any = {
    title: dto.title,
    description: dto.description,
    unitId: dto.unitId,
    videoLectureId: validVideoLectureId,
  };

  if (pdf) {
    materialData.fileUrl = process.env.WIZNOVY_CDN_LINK + pdf.path;
    materialData.filePath = pdf.path;
  }

  if (thumbnail) {
    materialData.thumbnailUrl = process.env.WIZNOVY_CDN_LINK + thumbnail.path;
    materialData.thumbnailPath = thumbnail.path;
  }

  const obj = this.repo.create(materialData);
  return this.repo.save(obj);
}



  async findAll(dto: StudyMaterialPaginationDto) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('studyMaterial')
      .leftJoinAndSelect('studyMaterial.unit', 'unit') 
      .leftJoinAndSelect('studyMaterial.videoLecture','videoLecture')
      .select([
        'studyMaterial.id',
        'studyMaterial.title',
        'studyMaterial.description',
        'studyMaterial.fileUrl',
        'studyMaterial.filePath',
        'studyMaterial.createdAt',
        'unit.id',
        'unit.name',
        'videoLecture.id',
        'videoLecture.title',
        'videoLecture.description',
        

      ]);

    if (dto.unitId) {
      queryBuilder.andWhere('studyMaterial.unitId = :unitId', { unitId: dto.unitId });
    }
    if (dto.videoLectureId) {
      queryBuilder.andWhere('studyMaterial.videoLectureId = :videoLectureId', { videoLectureId: dto.videoLectureId });
    }

    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('studyMaterial.title LIKE :keyword', {
            keyword: `%${keyword}%`,
          });
        }),
      );
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'studyMaterial.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async findByUser(dto: StudyMaterialFilterDto, accountId?: string) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('studyMaterial')
       .leftJoinAndSelect('studyMaterial.unit', 'unit') 
      .leftJoinAndSelect('studyMaterial.videoLecture','videoLecture')
      .select([
        'studyMaterial.id',
        'studyMaterial.title',
        'studyMaterial.description',
        'studyMaterial.fileUrl',
        'studyMaterial.filePath',
        'studyMaterial.createdAt',
        'unit.id',
        'unit.name',
        'videoLecture.id',
        'videoLecture.title',
        'videoLecture.description',
        

      ]);

    if (dto.unitId) {
      queryBuilder.andWhere('studyMaterial.unitId = :unitId', { unitId: dto.unitId });
    }
    if (dto.videoLectureId) {
      queryBuilder.andWhere('studyMaterial.videoLectureId = :videoLectureId', { videoLectureId: dto.videoLectureId });
    }
    

    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('studyMaterial.title LIKE :keyword', {
            keyword: `%${keyword}%`,
          });
        }),
      );
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'studyMaterial.createdAt': 'DESC' })
      .getManyAndCount();
    return { result, total };
  }
  

  async findOne(id: string) {
    const result = await this.repo.createQueryBuilder('studyMaterial')
      .leftJoinAndSelect('studyMaterial.unit', 'unit')
      .leftJoinAndSelect('studyMaterial.videoLecture', 'videoLecture')
    
      .select([
        'studyMaterial.id',
        'studyMaterial.title',
        'studyMaterial.description',
        'studyMaterial.fileUrl',
        'studyMaterial.filePath',
        'studyMaterial.unitId',
        'studyMaterial.videoLectureId',
        'studyMaterial.createdAt',
        'unit.id',
        'unit.name',
        'unit.courseId',
        'videoLecture.id',
        'videoLecture.title',
        
      ])
      .where('studyMaterial.id = :id', { id })
      .getOne();
    if (!result) {
      throw new NotFoundException('Study material not found!');
    }
    return result;
  }

  async getStudyContent(id: string, accountId?: string) {
    const result = await this.repo.findOne({
      where: { id },
      relations: ['unit']
    });
    if (!result) {
      throw new NotFoundException('Study material not found!');
    }

    return result;
  }

  async update(id: string, dto: UpdateStudyMaterialDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Study material not found!');
    }
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async pdf(file: string, result: StudyMaterial) {
    if (result.fileUrl) {
      const oldPath = join(__dirname, '..', '..', result.filePath);
      try {
        unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old file: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      // eslint-disable-next-line sonarjs/prefer-string-replace-all
      fileUrl: process.env.WIZNOVY_CDN_LINK + file.replace(/\\/g, '/'),
      filePath: file,
    });
    return this.repo.save(obj);
  }

 



}