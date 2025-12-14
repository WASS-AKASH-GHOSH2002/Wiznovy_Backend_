import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DefaultStatus, UserRole } from 'src/enum';
import { Brackets, Repository } from 'typeorm';
import {

  CreateAccountDto,
  SearchUserPaginationDto,
  UpdateStaffDto,
  UpdateStaffPasswordDto,
} from './dto/account.dto';
import { Account } from './entities/account.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserDetail } from 'src/user-details/entities/user-detail.entity';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import * as bcrypt from 'bcrypt';
import { StaffDetail } from 'src/staff-details/entities/staff-detail.entity';
import { DefaultStatusPaginationDto } from 'src/common/dto/default-status-pagination.dto';
import { Menu } from 'src/menus/entities/menu.entity';
import { TutorDetail } from 'src/tutor-details/entities/tutor-detail.entity';
import { NodeMailerService } from 'src/node-mailer/node-mailer.service';
import { UpdateUserContactDto } from './dto/update-user-contact.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account) private readonly repo: Repository<Account>,
    @InjectRepository(UserDetail)
    private readonly udRepo: Repository<UserDetail>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(StaffDetail)
    private readonly staffRepo: Repository<StaffDetail>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(TutorDetail)
    private readonly tutorRepo: Repository<TutorDetail>,
    private readonly nodeMailerService: NodeMailerService,
  ) { }

  async create(dto: CreateAccountDto, createdBy: string) {
    const user = await this.repo.findOne({
      where: { phoneNumber: dto.loginId, roles: UserRole.STAFF },
    });
    if (user) {
      throw new ConflictException('Login id already exists!');
    }

    const encryptedPassword = await bcrypt.hash(dto.password, 13);
    const obj = {
      phoneNumber: dto.loginId,
      password: encryptedPassword,
      createdBy,
      roles: UserRole.STAFF,
    };
    const payload = await this.repo.save(obj);
    const object = {
      name: dto.name,
      email: dto.email,
      dob: dto.dob.toISOString().split('T')[0],
      gender: dto.gender,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      pin: dto.pin,
      accountId: payload.id,
    };
    await this.staffRepo.save(object);
    return payload;
  }


  async getAllUsers(dto: SearchUserPaginationDto) {
    const keyword = dto.keyword || '';
    const query = this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',

        'userDetail.id',
        'userDetail.name',
        'userDetail.gender',
        // 'userDetail.age',
    
        // 'userDetail.address'
      ])
      .where('account.roles = :roles', { roles: UserRole.USER });

    if (keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'account.email LIKE :keyword OR account.phoneNumber LIKE :keyword OR userDetail.name LIKE :keyword ',
            { keyword: '%' + keyword + '%' }
          );
        })
      );
    }

    if (dto.status) {
      query.andWhere('account.status = :status', { status: dto.status });
    }

    const [result, total] = await query
      .orderBy({ 'userDetail.name': 'ASC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async getAllTutors(dto: SearchUserPaginationDto) {
    const keyword = dto.keyword || '';
    const query = this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('tutorDetail.country','country')
      .leftJoinAndSelect('tutorDetail.subject','subject')
      .leftJoinAndSelect('tutorDetail.qualification','qualification')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',

        'tutorDetail.id',
        'tutorDetail.tutorId',
        'tutorDetail.name',
        'tutorDetail.gender',
        'tutorDetail.hourlyRate',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.document',

        'country.id',
        'country.name',

        'subject.id',
        'subject.name',

        'qualification.id',
        'qualification.name'
      ])
      .where('account.roles = :roles', { roles: UserRole.TUTOR });

    if (keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'account.email LIKE :keyword OR account.phoneNumber LIKE :keyword OR tutorDetail.name LIKE :keyword ',
            { keyword: '%' + keyword + '%' }
          );
        })
      );
    }

    if (dto.status) {
      query.andWhere('account.status = :status', { status: dto.status });
    }

    if (dto.subjectId) {
      query.andWhere('tutorDetail.subjectId = :subjectId', { subjectId: dto.subjectId });
    }

    if (dto.countryId) {
      query.andWhere('tutorDetail.countryId = :countryId', { countryId: dto.countryId });
    }

    if (dto.qualificationId) {
      query.andWhere('tutorDetail.qualificationId = :qualificationId', { qualificationId: dto.qualificationId });
    }

    const [result, total] = await query
      .orderBy({ 'account.createdAt': 'DESC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }


async userProfile(id: string) {
  const result = await this.repo
    .createQueryBuilder('account')
    .leftJoinAndSelect('account.userDetail', 'userDetail')
    .leftJoinAndSelect('userDetail.topic', 'topic')
    .leftJoinAndSelect('userDetail.goal', 'goal')
    .leftJoinAndSelect('userDetail.country', 'country')
    .leftJoinAndSelect('userDetail.language', 'language')
    .leftJoinAndSelect('userDetail.budget', 'budget')
    .select([
      'account.id',
      'account.email',
      'account.phoneNumber',
      'account.roles',
      'account.status',
      'account.createdAt',

      'userDetail.id',
      'userDetail.name',
      'userDetail.gender',
      'userDetail.englishLevel',
      'userDetail.dob',
      'userDetail.address',
      'userDetail.profile',
      'userDetail.profileName',
      'userDetail.topicId',
      'userDetail.goalId',
      'userDetail.countryId',
      'userDetail.languageId',
      'userDetail.budgetId',
      'userDetail.qualificationId',
      'userDetail.createdAt',
      'userDetail.updatedAt',

      
      'topic.id',
      'topic.name',
      'goal.id',
      'goal.name',
      'country.id',
      'country.name',
      'language.id',
      'language.name',
      'budget.id',
      'budget.min',
      'budget.max'
    ])
    .where('account.id = :id', { id })
    .getOne();

  if (!result) {
    throw new NotFoundException('Profile Not Found!');
  }

  return result;
}

  async tutorProfile(id: string) {
    const result = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('tutorDetail.subject', 'subject')
      .leftJoinAndSelect('tutorDetail.city', 'city')
      .leftJoinAndSelect('tutorDetail.country', 'country')
      .leftJoinAndSelect('tutorDetail.language', 'language')
      .leftJoinAndSelect('tutorDetail.qualification', 'qualification')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',

        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.gender',
        'tutorDetail.expertiseLevel',
        'tutorDetail.dob',
        'tutorDetail.profileImage',
        'tutorDetail.profileImagePath',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.hourlyRate',
        'tutorDetail.createdAt',
        'tutorDetail.updatedAt',

        'subject.id',
        'subject.name',
        'city.id',
        'city.name',
        'country.id',
        'country.name',
        'language.id',
        'language.name',
        'qualification.id',
        'qualification.name'
      ])
      .where('account.id = :id', { id })
      .getOne();

    if (!result) {
      throw new NotFoundException('Tutor Profile Not Found!');
    }

    return result;
  }

  async getStaffDetails(dto: DefaultStatusPaginationDto) {
    const keyword = dto.keyword || '';
    const query =  this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .select([
        'account.id',
        'account.phoneNumber',
        'account.password',
        'account.roles',
        'account.status',
        'account.createdAt',
        'staffDetail.id',
        'staffDetail.name',
        'staffDetail.email',
        'staffDetail.dob',
        'staffDetail.createdAt',
      ])
      .where('account.roles = :roles AND account.status = :status', {
        roles: UserRole.STAFF,
        status: dto.status,
      });

    const [result, total] = await query
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'account.phoneNumber LIKE :keyword OR staffDetail.name LIKE :keyword OR staffDetail.email LIKE :keyword',
            {
              keyword: '%' + keyword + '%',
            },
          );
        }),
      )
      .orderBy({ 'staffDetail.name': 'ASC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async getStaffProfile(accountId: string) {
    let perms = await this.cacheManager.get('staffDetailPerms' + accountId);
    if (!perms) {
      perms = await this.menuRepo
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.userPermission', 'userPermission')
        .leftJoinAndSelect('userPermission.permission', 'permission')
        .where('userPermission.accountId = :accountId', {
          accountId: accountId,
        })
        .orderBy({ 'menu.title': 'ASC', 'permission.id': 'ASC' })
        .getMany();
      this.cacheManager.set(
        'staffDetailPerms' + accountId,
        perms,
        6 * 60 * 60 * 1000,
      );
    }
    return { perms };
  }

  async updateStaff(accountId: string, dto: UpdateStaffDto) {
    const result = await this.staffRepo.findOne({ where: { accountId } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    Object.assign(result, dto);
    return this.staffRepo.save(result);
  }

  async updateStaffPassword(accountId: string, dto: UpdateStaffPasswordDto) {
    const result = await this.repo.findOne({ where: { id: accountId } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    if (dto.loginId && dto.loginId.length > 0) {
      const obj = Object.assign(result, { phoneNumber: dto.loginId });
      await this.repo.save(obj);
    }
    if (dto.password && dto.password.length > 0) {
      const password = await bcrypt.hash(dto.password, 10);
      const obj = Object.assign(result, { password: password });
      await this.repo.save(obj);
    }
    return result;
  }

  async updateAccountStatus(id: string, dto: DefaultStatusDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    const oldStatus = result.status;
    const obj = { ...result, ...dto };
    const updatedAccount = await this.repo.save(obj);

    
    if (oldStatus !== dto.status && result.email) {
      await this.sendStatusChangeEmail(result.email, result.roles, dto.status);
    }

    return updatedAccount;
  }

  async staffStatus(id: string, dto: DefaultStatusDto) {
    return this.updateAccountStatus(id, dto);
  }

  async userStatus(id: string, dto: DefaultStatusDto) {
    return this.updateAccountStatus(id, dto);
  }

  async tutorStatus(id: string, dto: DefaultStatusDto) {
    return this.updateAccountStatus(id, dto);
  }

  async deleteUser(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    await this.repo.remove(result);
  }

  async bulkUserStatus(ids: string[], status: DefaultStatus) {
    const result = await this.repo.update(ids, { status });
    return { updated: result.affected };
  }

  async bulkTutorStatus(ids: string[], status: DefaultStatus) {
    const result = await this.repo.update(ids, { status });
    return { updated: result.affected };
  }

  async updateUserContact(id: string, dto: UpdateUserContactDto) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }

    
    if (dto.email) {
      const existingUser = await this.repo.findOne({ 
        where: { 
          email: dto.email,
          roles: result.roles
        } 
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`Email already exists for another ${result.roles.toLowerCase()} account`);
      }
    }

    if (dto.phoneNumber) {
      const existingUser = await this.repo.findOne({ 
        where: { 
          phoneNumber: dto.phoneNumber,
          roles: result.roles
        } 
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`Phone number already exists for another ${result.roles.toLowerCase()} account`);
      }
    }

    const obj = { ...result, ...dto };
    return this.repo.save(obj);
  }

  private async sendStatusChangeEmail(email: string, role: UserRole, newStatus: DefaultStatus) {
    const roleNames = {
      [UserRole.USER]: 'User',
      [UserRole.TUTOR]: 'Tutor',
      [UserRole.STAFF]: 'Staff',
      [UserRole.ADMIN]: 'Admin'
    };

    const statusMessages = {
      [DefaultStatus.ACTIVE]: 'Your account has been activated and you can now access all features.',
      [DefaultStatus.DEACTIVE]: 'Your account has been deactivated. Please contact support for assistance.',
      [DefaultStatus.SUSPENDED]: 'Your account has been suspended due to policy violations.',
      [DefaultStatus.PENDING]: 'Your account is under review and will be processed soon.',
      [DefaultStatus.DELETED]: 'Your account has been deleted.'
    };

    await this.nodeMailerService.sendAccountStatusEmail(
      email,
      roleNames[role],
      newStatus,
      statusMessages[newStatus]
    );
  }
}
