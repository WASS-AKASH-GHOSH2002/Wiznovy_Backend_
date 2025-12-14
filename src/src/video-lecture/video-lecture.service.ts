import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { VideoLecture } from './entities/video-lecture.entity';
import { CreateVideoLectureDto, Filter, UpdateVideoLectureDto, VideoLecturePaginationDto } from './dto/create-video-lecture.dto';
import { Unit } from 'src/unit/entities/unit.entity';
import { Course } from 'src/course/entities/course.entity';
import { CourseService } from 'src/course/course.service';
import { join } from 'path';
import { unlinkSync } from 'fs';

@Injectable()
export class VideoLectureService {
  constructor(
    @InjectRepository(VideoLecture)
    private readonly repo: Repository<VideoLecture>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly courseService: CourseService
  ) { }

  async create(dto: CreateVideoLectureDto, video?: Express.Multer.File, thumbnail?: Express.Multer.File) {
    
    const videoData: any = { ...dto };
    
    if (video) {
      videoData.videoUrl = process.env.WIZNOVY_CDN_LINK + video.path;
      videoData.videoPath = video.path;
    }
    
    if (thumbnail) {
      videoData.thumbnailUrl = process.env.WIZNOVY_CDN_LINK + thumbnail.path;
      videoData.thumbnailPath = thumbnail.path;
    }
    
    const result = await this.repo.save(videoData);
    
    if (result.unitId) {
      const unit = await this.unitRepo.findOne({ where: { id: result.unitId } });
      if (unit?.courseId) {
        await this.courseService.updateCourseStats(unit.courseId);
      }
    }
    
    return result;
  }

  async findAll(dto: VideoLecturePaginationDto) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('videoLecture')
      .leftJoinAndSelect('videoLecture.unit', 'unit')
      .select([
        'videoLecture.id',
        'videoLecture.title',
        'videoLecture.description',
        'videoLecture.videoUrl',
        'videoLecture.videoPath',
        'videoLecture.thumbnailUrl',
        'videoLecture.thumbnailPath',
        'videoLecture.duration',
        'videoLecture.createdAt',

        'unit.id',
        'unit.name',

      
        
      ]);

    if (dto.unitId) {
      queryBuilder.andWhere('videoLecture.unitId = :unitId', { unitId: dto.unitId });
    }




    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('videoLecture.title LIKE :keyword', {
            keyword: '%' + keyword + '%',
          });
        }),
      );
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'videoLecture.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();
    return { result, total };
  }

  async findByUser(dto: Filter) {
    const keyword = dto.keyword || '';
    const queryBuilder = this.repo.createQueryBuilder('videoLecture')
      .leftJoinAndSelect('videoLecture.unit', 'unit')
     
      .select([
        'videoLecture.id',
        'videoLecture.title',
        'videoLecture.description',
        'videoLecture.videoUrl',
        'videoLecture.videoPath',
        'videoLecture.thumbnailUrl',
        'videoLecture.thumbnailPath',
        'videoLecture.duration',
        'videoLecture.createdAt',

        'unit.id',
        'unit.name',

      

        
      ]);

    if (dto.unitId) {
      queryBuilder.andWhere('videoLecture.unitId = :unitId', { unitId: dto.unitId });
    }




  

   

    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('videoLecture.title LIKE :keyword', {
            keyword: '%' + keyword + '%',
          });
        }),
      );
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'videoLecture.createdAt': 'DESC' })
      .limit(dto.limit)
      .offset(dto.offset)
      .getManyAndCount();
    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.createQueryBuilder('videoLecture')
      .leftJoinAndSelect('videoLecture.unit', 'unit')
    
      .select([
        'videoLecture.id',
        'videoLecture.title',
        'videoLecture.description',
        'videoLecture.videoUrl',
        'videoLecture.videoPath',
        'videoLecture.thumbnailUrl',
        'videoLecture.thumbnailPath',
        'videoLecture.duration',
        'videoLecture.unitId',
        'videoLecture.createdAt',
        'unit.id',
        'unit.name',
        'unit.courseId',
     
      ])
      .where('videoLecture.id = :id', { id })
      .getOne();
    if (!result) {
      throw new NotFoundException('Video lecture not found!');
    }
    return result;
  }

  async getVideoContent(id: string, accountId?: string) {
    const result = await this.repo.findOne({
      where: { id },
      relations: ['unit']
    });
    if (!result) {
      throw new NotFoundException('Video lecture not found!');
    }
    return result;
  }

  async uploadVideo(file: string, result: VideoLecture) {
    if (result.videoPath) {
      const oldPath = join(__dirname, '..', '..', result.videoPath);
      try {
        await unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old video: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      videoUrl: process.env.WIZNOVY_CDN_LINK + file,
      videoPath: file,
    });
    return this.repo.save(obj);
  }

  async thumbnail(file: string, result: VideoLecture) {
    if (result.thumbnailPath) {
      const oldPath = join(__dirname, '..', '..', result.thumbnailPath);
      try {
        await unlinkSync(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old thumbnail: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      thumbnailUrl: process.env.WIZNOVY_CDN_LINK + file,
      thumbnailPath: file,
    });
    return this.repo.save(obj);
  }

  async update(id: string, dto: UpdateVideoLectureDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Video lecture not found!');
    }
    Object.assign(result, dto);
    const updated = await this.repo.save(result);
    
    
    return updated;
  }

  async getTutorVideosByUnit(unitId: string, tutorId: string) {
    const unit = await this.unitRepo.findOne({ 
      where: { id: unitId }, 
      relations: ['course'] 
    });
    
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    
    if (unit.course?.tutorId !== tutorId) {
      throw new NotFoundException('You can only access your own course units');
    }
    
    return this.repo.find({
      where: { unitId },
      relations: ['unit'],
      order: { createdAt: 'DESC' }
    });
  }

 

}