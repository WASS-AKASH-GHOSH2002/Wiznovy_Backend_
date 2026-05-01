import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto, SubjectPaginationDto, UpdateStatusDto, BulkSubjectStatusDto, TutorSubjectRequestDto, ApproveTutorSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { TutorSubject } from 'src/tutor-details/entities/tutor-subject.entity';
import { DefaultStatus, UserRole } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()

export class SubjectsService {

constructor(
  @InjectRepository(Subject) private readonly repo: Repository<Subject>,
  @InjectRepository(TutorDetail) private readonly tutorRepo: Repository<TutorDetail>,
  @InjectRepository(TutorSubject) private readonly tutorSubjectRepo: Repository<TutorSubject>,
  private readonly notificationsService: NotificationsService,
  private readonly settingsService: SettingsService,
)
{}
  async getTopSubjects() {
    return this.repo.createQueryBuilder('subject')
      .select(['subject.id', 'subject.name', 'subject.image', 'subject.imagePath', 'subject.status'])
      .where('subject.topSubject = :topSubject', { topSubject: true })
      .andWhere('subject.status = :status', { status: DefaultStatus.ACTIVE })
      .orderBy('subject.name', 'ASC')
      .getMany();
  }

  async updateTopSubject(id: string, topSubject: boolean) {
    const subject = await this.repo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    if (topSubject) {
      
      const max =  5;
      const currentCount = await this.repo.count({ where: { topSubject: true } });
      if (currentCount >= max) {
        throw new ConflictException(`Maximum top subjects limit (${max}) reached. Remove a top subject first.`);
      }
    }

    subject.topSubject = topSubject;
    return this.repo.save(subject);
  }

  async create(createSubjectDto: CreateSubjectDto, accountId: string) {
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

return this.repo.save({ ...createSubjectDto, createdBy: accountId })

  }

   async findAll(dto:SubjectPaginationDto) {
    const query = this.repo.createQueryBuilder('subject')
    .select(
      [
        'subject.id',
        'subject.name',
        'subject.image',
        'subject.imagePath',
        'subject.status',
        'subject.topSubject',
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
        }

      if (dto.topSubject !== undefined && dto.topSubject !== null) {
        query.andWhere('subject.topSubject = :topSubject', { topSubject: dto.topSubject });
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

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const result = await this.repo.findOne({ where: { id }, relations: ['creator'] });
    if (!result) throw new ConflictException('Subject not found');

    const obj = Object.assign(result, dto);
    const saved = await this.repo.save(obj);

    if (result.creator?.roles === UserRole.TUTOR) {
      await this.notificationsService.create({
        title: 'Subject Status Updated',
        desc: `Your subject "${result.name}" status has been updated to ${dto.status}`,
        type: 'NEW_PRODUCT',
        accountId: result.createdBy,
      });
    }

    return saved;
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

async bulkUpdateStatus(dto: BulkSubjectStatusDto) {
  await this.repo.update(dto.ids, { status: dto.status });
  return { message: `${dto.ids.length} subjects status updated successfully` };
}

async tutorCreateSubject(dto: CreateSubjectDto, accountId: string) {
  const existing = await this.repo.findOne({ where: { name: dto.name } });
  if (existing) throw new ConflictException('Subject with this name already exists');
  return this.repo.save({ ...dto, createdBy: accountId, status: DefaultStatus.PENDING });
}

async getTutorPendingSubjects(dto: SubjectPaginationDto) {
  const query = this.repo
    .createQueryBuilder('subject')
    .innerJoin('subject.creator', 'creator', 'creator.roles = :role', { role: 'TUTOR' })
    .leftJoin('creator.tutorDetail', 'tutorDetail')
    .select([
      'subject.id',
      'subject.name',
      'subject.image',
      'subject.status',
      'subject.createdAt',
      'creator.id',
      'creator.email',
      'tutorDetail.name',
      'tutorDetail.tutorId',
      'tutorDetail.profileImage',
    ])
    .where('subject.status = :status', { status: DefaultStatus.PENDING });

  if (dto.keyword) {
    query.andWhere('subject.name LIKE :keyword', { keyword: `%${dto.keyword}%` });
  }

  const [result, total] = await query
    .orderBy('subject.createdAt', 'DESC')
    .skip(dto.offset)
    .take(dto.limit)
    .getManyAndCount();

  return { result, total };
}

async requestSubjects(accountId: string, dto: TutorSubjectRequestDto) {
  const tutor = await this.tutorRepo.findOne({ where: { accountId } });
  if (!tutor) throw new NotFoundException('Tutor profile not found');

  const results = [];
  for (const subjectId of dto.subjectIds) {
    const subject = await this.repo.findOne({ where: { id: subjectId } });
    if (!subject) continue;

    const existing = await this.tutorSubjectRepo.findOne({ where: { tutorId: tutor.id, subjectId } });
    if (existing) continue;

    const entry = this.tutorSubjectRepo.create({ tutorId: tutor.id, subjectId, status: DefaultStatus.PENDING });
    results.push(await this.tutorSubjectRepo.save(entry));
  }
  return { message: 'Subject requests submitted', data: results };
}

async getPendingSubjectRequests(dto: SubjectPaginationDto) {
  const [result, total] = await this.tutorSubjectRepo
    .createQueryBuilder('ts')
    .leftJoinAndSelect('ts.tutor', 'tutor')
    .leftJoinAndSelect('ts.subject', 'subject')
    .where('ts.status = :status', { status: DefaultStatus.PENDING })
    .orderBy('ts.createdAt', 'DESC')
    .skip(dto.offset)
    .take(dto.limit)
    .getManyAndCount();
  return { result, total };
}

async approveSubjectRequest(id: string, dto: ApproveTutorSubjectDto) {
  const entry = await this.tutorSubjectRepo.findOne({ where: { id } });
  if (!entry) throw new NotFoundException('Subject request not found');
  entry.status = dto.status;
  return this.tutorSubjectRepo.save(entry);
}

}
