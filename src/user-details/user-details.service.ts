import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Repository } from 'typeorm';
import { UpdateUserDetailDto } from './dto/update-user-details.dto';
import { UserDetail } from './entities/user-detail.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetail) private readonly repo: Repository<UserDetail>,
    @InjectRepository(Account)
    private readonly accountrepo: Repository<Account>,
  ) {}

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { accountId: id } });
    if (!result) {
      throw new NotFoundException('User not found!');
    }
    return result;
  }

  async update(dto: UpdateUserDetailDto, accountId: string) {
    const result = await this.repo.findOne({ where: { accountId: accountId } });
    if (!result) {
      throw new NotFoundException('User profile not found!');
    }
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async profileImage(image: string, result: UserDetail) {
    if (result.profileName) {
      const oldPath = join(__dirname, '..', '..', result.profileName);
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
      profile: process.env.WIZNOVY_CDN_LINK + image,
      profileName: image,
    });
    return this.repo.save(obj);
  }

  
  async getOverview(accountId: string) {
    const detail = await this.findOne(accountId);

    return {
      personalDetail: !!detail.name && !!detail.dob,
      primaryGoal: !!detail.goalId,
      tutorDetails: !!detail.topicId,
      educationDetails: !!detail.englishLevel,
      languagePreference: !!detail.languageId,
      profileDetails: !!detail.profile,
      profileImage: detail.profileName
        ? `${process.env.WIZNOVY_CDN_LINK}/${detail.profileName}`
        : null,
    };
  }
}
