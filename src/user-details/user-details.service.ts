import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { Repository } from 'typeorm';
import { UpdateUserDetailDto } from './dto/update-user-details.dto';
import { UserDetail } from './entities/user-detail.entity';
import { AdminActionLogService } from 'src/admin-action-log/admin-action-log.service';
import { AdminActionType, AdminActionTargetType } from 'src/enum';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { NodeMailerService } from 'src/node-mailer/node-mailer.service';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetail) private readonly repo: Repository<UserDetail>,
    @InjectRepository(Account)
    private readonly accountrepo: Repository<Account>,
    private readonly adminActionLogService: AdminActionLogService,
    private readonly nodeMailerService: NodeMailerService,
  ) {}

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { accountId: id } });
    if (!result) {
      throw new NotFoundException('User not found!');
    }
    return result;
  }

  async update(dto: UpdateUserDetailDto, accountId: string, adminId?: string) {
    const result = await this.repo.findOne({ where: { accountId: accountId } });
    if (!result) {
      throw new NotFoundException('User profile not found!');
    }

    const changesList = Object.keys(dto)
      .filter(k => k !== 'accountId' && dto[k] !== undefined && dto[k] !== result[k])
      .map(k => `${k} was updated`);

    const obj = Object.assign(result, dto);
    const updated = await this.repo.save(obj);

    if (adminId && adminId !== accountId) {
      await this.adminActionLogService.log(
        adminId,
        AdminActionType.USER_UPDATED,
        accountId,
        AdminActionTargetType.USER,
        `User profile updated for ${result.name || accountId}`
      );
    }

    if (changesList.length > 0) {
      const account = await this.accountrepo.findOne({ where: { id: accountId } });
      if (account?.email) {
        const firstName = result.name?.split(' ')[0] || 'User';
        this.nodeMailerService.sendProfileUpdateEmail(account.email, firstName, changesList).catch(() => {});
      }
    }

    return updated;
  }

  async updateLocation(accountId: string, dto: { lat: number; lng: number; timezone: string }) {
    const result = await this.repo.findOne({ where: { accountId } });
    if (!result) throw new NotFoundException('User profile not found!');
    result.lat = dto.lat;
    result.lng = dto.lng;
    result.timezone = dto.timezone;
    return this.repo.save(result);
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
