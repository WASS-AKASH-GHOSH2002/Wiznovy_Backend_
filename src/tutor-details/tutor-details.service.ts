import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Repository } from 'typeorm';
import { UpdateTutorDetailDto } from './dto/update-tutor-details.dto';
import { TutorDetail } from './entities/tutor-detail.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class TutorDetailsService {
  constructor(
    @InjectRepository(TutorDetail) private readonly repo: Repository<TutorDetail>,
    @InjectRepository(Account)
    private readonly accountrepo: Repository<Account>,
  ) {}

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { accountId: id } });
    if (!result) {
      throw new NotFoundException('Tutor not found!');
    }
    return result;
  }

  async update(dto: UpdateTutorDetailDto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId: accountId } });
    if (!result) {
      throw new NotFoundException('Tutor profile not found!');
    }
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
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
  async getOverview(accountId: string) {
    const detail = await this.findOne(accountId);

    return {
      personalDetail: !!detail.name && !!detail.dob,
      subjectExpertise: !!detail.subjectId,
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
    .leftJoinAndSelect('tutor.language', 'language')
    .leftJoinAndSelect('tutor.qualification', 'qualification')
    .leftJoinAndSelect('tutor.city', 'city')
    .select([
      'tutor.id',
      'tutor.name',
      'tutor.dob',
      'tutor.gender',
      'tutor.expertiseLevel',
      'tutor.hourlyRate',
      'tutor.profileImage',
      'tutor.profileImagePath',
      'tutor.bio',
      'tutor.averageRating',
      'tutor.totalRatings',
      'tutor.createdAt',
      'tutor.updatedAt',
      
      'account.id',

      'subject.id',
      'subject.name',

      'country.id',
      'country.name',

      'state.id',
      'state.name',

      'language.id',
      'language.name',

      'qualification.id',
      'qualification.name',
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
      .select([
        'tutor.id',
        'tutor.name',
        'tutor.tutorId',
        'tutor.dob',
        'tutor.gender',
        'tutor.expertiseLevel',
        'tutor.hourlyRate',
        'tutor.profileImage',
        'tutor.bio',
        'tutor.averageRating',
        'tutor.totalRatings',
        'tutor.sessionDuration',
        'tutor.bufferTimeMinutes',
        'tutor.createdAt',
        

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
      ])
      .where('tutor.accountId = :id', { id })
      .getOne();

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return tutor;
  }

  
  }
