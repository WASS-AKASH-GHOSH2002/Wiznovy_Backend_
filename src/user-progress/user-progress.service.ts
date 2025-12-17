import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from './entities/user-progress.entity';
import { Course } from '../course/entities/course.entity';
import { Unit } from '../unit/entities/unit.entity';
import { StudyMaterial } from '../study-material/entities/study-material.entity';
import { PurchaseType } from '../enum';
import { MarkProgressDto, UserProgressPaginationDto } from './dto/mark-progress.dto';

@Injectable()
export class UserProgressService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly repo: Repository<UserProgress>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(StudyMaterial)
    private readonly studyRepo: Repository<StudyMaterial>,
  ) {}

  async updateProgress(dto: MarkProgressDto) {
    try {
      if (!dto.userId || !dto.contentType) {
        throw new BadRequestException('UserId and contentType are required');
      }

      const whereCondition = this.buildWhereCondition(dto);
      const existing = await this.repo.findOne({ where: whereCondition });

      const isCompleted = dto.value >= 100;

      if (existing) {
        existing.value = dto.value;
        existing.isCompleted = isCompleted;
        return await this.repo.save(existing);
      }

      return await this.repo.save({
        ...dto,
        isCompleted,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update progress: ${error.message}`);
    }
  }

  private buildWhereCondition(dto: MarkProgressDto) {
    const where: any = { userId: dto.userId, contentType: dto.contentType };

    if (dto.courseId) where.courseId = dto.courseId;
    if (dto.unitId) where.unitId = dto.unitId;
    if (dto.studyMaterialId) where.studyMaterialId = dto.studyMaterialId;
    if (dto.contentId) where.contentId = dto.contentId;

    return where;
  }

  async createProgressRecordsForPurchase(userId: string, purchaseType: PurchaseType, itemId: string) {
    try {
      if (!userId || !purchaseType || !itemId) {
        throw new BadRequestException('UserId, purchaseType, and itemId are required');
      }

      const records = [];

      if (purchaseType === PurchaseType.COURSE) {
        const course = await this.courseRepo.findOne({
          where: { id: itemId },
          relations: ['units', 'units.videoLectures', 'units.videoLectures.studyMaterials', 'courseContents', 'courseContents.studyMaterial']
        });

        if (course) {

          records.push({
            userId,
            courseId: itemId,
            contentType: 'COURSE',
            value: 0,
            isCompleted: false
          });

         
          for (const unit of course.units || []) {
            if (unit?.id) {
              records.push({
                userId,
                courseId: itemId,
                unitId: unit.id,
                contentType: 'UNIT',
                value: 0,
                isCompleted: false
              });

              for (const videoLecture of unit.videoLectures || []) {
                for (const material of videoLecture.studyMaterials || []) {
                  if (material?.id) {
                    records.push({
                      userId,
                      courseId: itemId,
                      unitId: unit.id,
                      studyMaterialId: material.id,
                      contentType: 'STUDY_MATERIAL',
                      value: 0,
                      isCompleted: false
                    });
                  }
                }
              }
            }
          }

  

        }
      } else if (purchaseType === PurchaseType.UNIT) {
        const unit = await this.unitRepo.findOne({
          where: { id: itemId },
          relations: ['videoLectures', 'videoLectures.studyMaterials']
        });

        if (unit?.id) {
          records.push({
            userId,
            unitId: itemId,
            contentType: 'UNIT',
            value: 0,
            isCompleted: false
          });

          for (const videoLecture of unit.videoLectures || []) {
            for (const material of videoLecture.studyMaterials || []) {
              if (material?.id) {
                records.push({
                  userId,
                  unitId: itemId,
                  studyMaterialId: material.id,
                  contentType: 'STUDY_MATERIAL',
                  value: 0,
                  isCompleted: false
                });
              }
            }
          }
        }
      } else if (purchaseType === PurchaseType.STUDY_MATERIAL) {
        records.push({
          userId,
          studyMaterialId: itemId,
          contentType: 'STUDY_MATERIAL',
          value: 0,
          isCompleted: false
        });
      }

      if (records.length > 0) {
        return await this.repo.save(records);
      }
      return [];
    } catch (error) {
      throw new BadRequestException(`Failed to create progress records: ${error.message}`);
    }
  }

  async findAll(dto: UserProgressPaginationDto) {
    const queryBuilder = this.repo.createQueryBuilder('userProgress')
      .leftJoin('userProgress.user', 'user')
      .leftJoin('user.userDetail', 'userDetail')
      .leftJoin('userProgress.course', 'course')
      .leftJoin('userProgress.unit', 'unit')
      .leftJoin('userProgress.studyMaterial', 'studyMaterial')
      .select([
        'userProgress.id',
        'userProgress.userId',
        'userProgress.contentType',
        'userProgress.value',
        'userProgress.isCompleted',
        'userProgress.createdAt',
        'userProgress.updatedAt',
        'user.id',
        'user.email',
        'user.phoneNumber',
        'userDetail.name',
        'course.id',
        'course.name',
        'unit.id',
        'unit.name',
        'studyMaterial.id',
        'studyMaterial.title'
      ]);

    if (dto.userId) {
      queryBuilder.andWhere('userProgress.userId = :userId', { userId: dto.userId });
    }

    if (dto.courseId) {
      queryBuilder.andWhere('userProgress.courseId = :courseId', { courseId: dto.courseId });
    }

    if (dto.unitId) {
      queryBuilder.andWhere('userProgress.unitId = :unitId', { unitId: dto.unitId });
    }

    if (dto.contentType) {
      queryBuilder.andWhere('userProgress.contentType = :contentType', { contentType: dto.contentType });
    }

    if (dto.isCompleted) {
      const isCompleted = dto.isCompleted === 'true';
      queryBuilder.andWhere('userProgress.isCompleted = :isCompleted', { isCompleted });
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'userProgress.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findAllByUser(userId: string, dto: UserProgressPaginationDto) {
    const queryBuilder = this.repo.createQueryBuilder('userProgress')
      .leftJoin('userProgress.course', 'course')
      .leftJoin('userProgress.unit', 'unit')
      .leftJoin('userProgress.studyMaterial', 'studyMaterial')
      .where('userProgress.userId = :userId', { userId })
      .select([
        'userProgress.id',
        'userProgress.contentType',
        'userProgress.value',
        'userProgress.isCompleted',
        'userProgress.createdAt',
        'course.id',
        'course.name',
        'unit.id',
        'unit.name',
        'studyMaterial.id',
        'studyMaterial.title',
      ]);

    if (dto.courseId) {
      queryBuilder.andWhere('userProgress.courseId = :courseId', { courseId: dto.courseId });
    }

    if (dto.unitId) {
      queryBuilder.andWhere('userProgress.unitId = :unitId', { unitId: dto.unitId });
    }

    if (dto.contentType) {
      queryBuilder.andWhere('userProgress.contentType = :contentType', { contentType: dto.contentType });
    }

    if (dto.isCompleted) {
      const isCompleted = dto.isCompleted === 'true';
      queryBuilder.andWhere('userProgress.isCompleted = :isCompleted', { isCompleted });
    }

    const [result, total] = await queryBuilder
      .orderBy({ 'userProgress.createdAt': 'DESC' })
      .getManyAndCount();

    return { result, total };
  }

  async createProgressForPurchase(userId: string, purchaseType: string, itemId: string) {
    try {
      if (!Object.values(PurchaseType).includes(purchaseType as PurchaseType)) {
        throw new BadRequestException(`Invalid purchase type: ${purchaseType}`);
      }

      const purchaseTypeEnum = purchaseType as PurchaseType;
      return await this.createProgressRecordsForPurchase(userId, purchaseTypeEnum, itemId);
    } catch (error) {
      throw new BadRequestException(`Failed to create progress for purchase: ${error.message}`);
    }
  }
}
