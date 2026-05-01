import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Repository } from 'typeorm';
import { UpdateTutorDetailDto } from './dto/update-tutor-details.dto';
import { TutorStep1Dto, TutorStep2Dto, TutorStep3Dto, TutorStep4Dto, TutorStep5Dto, TutorStep6Dto, TutorStep7Dto, TutorStep9Dto, TutorStep10Dto } from './dto/tutor-steps.dto';
import { TutorDetail } from './entities/tutor-detail.entity';
import { TutorSubject } from './entities/tutor-subject.entity';
import { AdminActionLogService } from 'src/admin-action-log/admin-action-log.service';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class TutorDetailsService {
  constructor(
    @InjectRepository(TutorDetail) private readonly repo: Repository<TutorDetail>,
    @InjectRepository(TutorSubject) private readonly tutorSubjectRepo: Repository<TutorSubject>,
    @InjectRepository(Account)
    private readonly accountrepo: Repository<Account>,
    private readonly adminActionLogService: AdminActionLogService,
  ) {}

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { accountId: id } });
    if (!result) {
      throw new NotFoundException('Tutor not found!');
    }
    return result;
  }

  async update(dto: UpdateTutorDetailDto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');

    const { subjectIds, ...rest } = dto;
    const obj = Object.assign(result, rest);
    const updated = await this.repo.save(obj);

    if (subjectIds?.length) {
      await this.tutorSubjectRepo.delete({ tutorId: updated.id });
      const entries = subjectIds.map((subjectId) =>
        this.tutorSubjectRepo.create({ tutorId: updated.id, subjectId }),
      );
      await this.tutorSubjectRepo.save(entries);
    }

    return updated;
  }

  async updateStep1(dto: TutorStep1Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep2(dto: TutorStep2Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep3(dto: TutorStep3Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep4(dto: TutorStep4Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep5(dto: TutorStep5Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async qualificationCertification(filePath: string, result: TutorDetail) {
    if (result.qualificationCertification) {
      const oldPath = join(__dirname, '..', '..', result.qualificationCertification);
      try { await unlink(oldPath); } catch (err) {
        console.warn(`Failed to delete old certification: ${oldPath}`, err.message);
      }
    }
    Object.assign(result, {
      qualificationCertification: process.env.WIZNOVY_CDN_LINK + filePath,
      qualificationCertificationName: filePath,
    });
    return this.repo.save(result);
  }

  async updateStep6(dto: TutorStep6Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep7(dto: TutorStep7Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep9(dto: TutorStep9Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateStep10(dto: TutorStep10Dto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async updateLocation(accountId: string, dto: { lat: number; lng: number; timezone: string }) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('Tutor profile not found!');
    result.lat = dto.lat;
    result.lng = dto.lng;
    result.timezone = dto.timezone;
    return this.repo.save(result);
  }

  async profileImage(image: string, result: TutorDetail) {
    if (result.profileImagePath) {
      const oldPath = join(__dirname, '..', '..', result.profileImagePath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(
          `Failed to delete old profile image: ${oldPath}`,
          err.message,
        );
      }
    }
    const obj = Object.assign(result, {
      profileImage: process.env.WIZNOVY_CDN_LINK + image,
      profileImagePath: image,
    });
    return this.repo.save(obj);
  }


  
  async introductionVideo(filePath: string, result: TutorDetail) {
    if (result.introductionVideoPath) {
      const oldPath = join(__dirname, '..', '..', result.introductionVideoPath);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old introduction video: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      introductionVideo: process.env.WIZNOVY_CDN_LINK + filePath,
      introductionVideoPath: filePath,
    });
    return this.repo.save(obj);
  }

  async document(filePath: string, result: TutorDetail) {
    if (result.documentName) {
      const oldPath = join(__dirname, '..', '..', result.documentName);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.warn(`Failed to delete old document: ${oldPath}`, err.message);
      }
    }
    const obj = Object.assign(result, {
      document: process.env.WIZNOVY_CDN_LINK + filePath,
      documentName: filePath,
    });
    return this.repo.save(obj);
  }
  async getCurrentStep(accountId: string): Promise<{ currentStep: number; completed?: boolean }> {
    const detail = await this.repo.findOne({ where: { accountId } });
    if (!detail) throw new NotFoundException('Tutor profile not found!');

    

    if ( !detail.dob || !detail.gender) return { currentStep: 1 };
    if ( !detail.subjectId) return { currentStep: 2 };
    if (!detail.countryId) return { currentStep: 3 };
    if (!detail.budgetId) return { currentStep: 4 };
    if (!detail.qualificationId) return { currentStep: 5 };
    if (detail.teachingExperience === null || detail.teachingExperience === undefined) return { currentStep: 6 };
    if (!detail.languageId || !detail.languageProficiency) return { currentStep: 7 };
    if (!detail.document) return { currentStep: 8 };
    if (!detail.bio) return { currentStep: 9 };
    if (!detail.hourlyRate || !detail.trailRate) return { currentStep: 10 };
    if (!detail.introductionVideo) return { currentStep: 11 };

    return { currentStep: 12, completed: true };
  }

  async getOverview(accountId: string) {
    const detail = await this.findOne(accountId);

    return {
      personalDetail: !!detail.name && !!detail.dob,
      subjectExpertise: !!detail.subjectId || await this.tutorSubjectRepo.count({ where: { tutorId: detail.id } }).then(c => c > 0),
      expertiseLevel: !!detail.expertiseLevel,
      qualifications: !!detail.qualificationId,
      bio: !!detail.bio,
      languagePreference: !!detail.languageId,
      profileDetails: !!detail.profileImage,
      profileImage: detail.profileImagePath
        ? `${process.env.WIZNOVY_CDN_LINK}/${detail.profileImagePath}`
        : null,
    };
  }

 async findAllTutors() {
  return this.repo
    .createQueryBuilder('tutor')
    .leftJoinAndSelect('tutor.account', 'account')
    .leftJoinAndSelect('tutor.subject', 'subject')
    .leftJoinAndSelect('tutor.country', 'country')
    .leftJoinAndSelect('tutor.state', 'state')
    .leftJoinAndSelect('tutor.city', 'city')
    .leftJoinAndSelect('tutor.language', 'language')
    .leftJoinAndSelect('tutor.qualification', 'qualification')
    .leftJoinAndSelect('tutor.budget', 'budget')
    .leftJoinAndSelect('tutor.tutorSubjects', 'tutorSubjects')
    .leftJoinAndSelect('tutorSubjects.subject', 'tutorSubjectDetail')
    .select([
      'tutor.id',
      'tutor.tutorId',
      'tutor.name',
      'tutor.dob',
      'tutor.gender',
      'tutor.expertiseLevel',
      'tutor.hourlyRate',
      'tutor.trailRate',
      'tutor.profileImage',
      'tutor.profileImagePath',
      'tutor.bio',
      'tutor.averageRating',
      'tutor.totalRatings',
   
      'tutor.teachingExperience',
      'tutor.languageProficiency',
      'tutor.introductionVideo',
      'tutor.introductionVideoPath',
      'tutor.document',
      'tutor.documentName',
      'tutor.qualificationCertification',
      'tutor.qualificationCertificationName',
      'tutor.createdAt',
      'tutor.updatedAt',
      'account.id',
      'account.email',
      'account.phoneNumber',
      'account.status',
      'subject.id',
      'subject.name',
      'country.id',
      'country.name',
      'state.id',
      'state.name',
      'city.id',
      'city.name',
      'language.id',
      'language.name',
      'qualification.id',
      'qualification.name',
      'budget.id',
      'budget.min',
      'budget.max',
     
    ])
    .where('account.status = :status', { status: 'ACTIVE' })
    .andWhere('account.roles = :role', { role: 'TUTOR' })
    .getMany();
}

  async findById(id: string) {
    const tutor = await this.repo
      .createQueryBuilder('tutor')
      .leftJoinAndSelect('tutor.account', 'account')
      .leftJoinAndSelect('tutor.subject', 'subject')
      .leftJoinAndSelect('tutor.country', 'country')
      .leftJoinAndSelect('tutor.city', 'city')
      .leftJoinAndSelect('tutor.state', 'state')
      .leftJoinAndSelect('tutor.language', 'language')
      .leftJoinAndSelect('tutor.qualification', 'qualification')
      .leftJoinAndSelect('tutor.budget', 'budget')
      .leftJoinAndSelect('tutor.tutorSubjects', 'tutorSubjects')
      .leftJoinAndSelect('tutorSubjects.subject', 'tutorSubjectDetail')
      .select([
        'tutor.id',
        'tutor.tutorId',
        'tutor.name',
        'tutor.dob',
        'tutor.gender',
        'tutor.expertiseLevel',
        'tutor.hourlyRate',
        'tutor.trailRate',
        'tutor.profileImage',
        'tutor.profileImagePath',
        'tutor.bio',
        'tutor.averageRating',
        'tutor.totalRatings',
  
        'tutor.teachingExperience',
        'tutor.languageProficiency',
        'tutor.introductionVideo',
        'tutor.introductionVideoPath',
        'tutor.document',
        'tutor.documentName',
        'tutor.qualificationCertification',
        'tutor.qualificationCertificationName',
        'tutor.createdAt',
        'tutor.updatedAt',
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.status',
        'subject.id',
        'subject.name',
        'country.id',
        'country.name',
        'city.id',
        'city.name',
        'state.id',
        'state.name',
        'language.id',
        'language.name',
        'qualification.id',
        'qualification.name',
        'budget.id',
        'budget.min',
        'budget.max',
       
      ])
      .where('tutor.accountId = :id', { id })
      .getOne();

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return tutor;
  }

  
  }
