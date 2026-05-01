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
  StaffPaginationDto,
  UpdateMyPasswordDto,
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
import { PdfUtils } from 'src/utils/pdf.utils';
import { Response } from 'express';
import { BankDetail } from 'src/bank-details/entities/bank-detail.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletTransaction } from 'src/wallet-transaction/entities/wallet-transaction.entity';
import { Session } from 'src/session/entities/session.entity';
import { UserPurchase } from 'src/user-purchase/entities/user-purchase.entity';
import { LoginHistory } from 'src/login-history/entities/login-history.entity';
import { buildCsv, CsvColumn, formatCsvDate, generateCsvFileName, sendCsvResponse } from 'src/utils/csv.utils';
import { ExportStudentsCsvDto, DateRangePreset } from './dto/export-students-csv.dto';

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
    @InjectRepository(BankDetail)
    private readonly bankRepo: Repository<BankDetail>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(UserPurchase)
    private readonly purchaseRepo: Repository<UserPurchase>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepo: Repository<LoginHistory>,
  ) { }

  async create(dto: CreateAccountDto, createdBy: string) {
    if (dto.email) {
      const emailExists = await this.repo.findOne({
        where: { email: dto.email, roles: UserRole.STAFF },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists for a staff account!');
      }
    }

    if (dto.phoneNumber) {
      const phoneExists = await this.repo.findOne({
        where: { phoneNumber: dto.phoneNumber, roles: UserRole.STAFF },
      });
      if (phoneExists) {
        throw new ConflictException('Phone number already exists for a staff account!');
      }
    }

    const encryptedPassword = await bcrypt.hash(dto.password, 13);
    const obj = {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: encryptedPassword,
      createdBy,
      roles: UserRole.STAFF,
    };
    const payload = await this.repo.save(obj);
    const staffId = await this.generateStaffId();
    const object = this.staffRepo.create({
      name: dto.name,
      staffId,
      designationId: dto.designationId,
      dob: typeof dto.dob === 'string' ? dto.dob : new Date(dto.dob).toISOString().split('T')[0],
      gender: dto.gender,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      pin: dto.pin,
      accountId: payload.id,
    });
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
        'userDetail.userId',
        'userDetail.name',
        'userDetail.gender',
      ])
      .where('account.roles = :roles', { roles: UserRole.USER });

    if (keyword.length > 0) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            'account.email LIKE :keyword OR account.phoneNumber LIKE :keyword OR userDetail.name LIKE :keyword Or userDetail.userId',
            { keyword: '%' + keyword + '%' }
          );
        })
      );
    }

    if (dto.status) {
      query.andWhere('account.status = :status', { status: dto.status });
    }

    const [result, total] = await query
      .orderBy('account.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    const accountIds = result.map(r => r.id);
    if (accountIds.length === 0) return { result, total };

    const [sessionCounts, lastLogins] = await Promise.all([
      this.sessionRepo
        .createQueryBuilder('session')
        .select('session.userId', 'userId')
        .addSelect('COUNT(session.id)', 'totalSessions')
        .where('session.userId IN (:...ids)', { ids: accountIds })
        .groupBy('session.userId')
        .getRawMany(),
      this.loginHistoryRepo
        .createQueryBuilder('lh')
        .select('lh.accountId', 'accountId')
        .addSelect('MAX(lh.loginTime)', 'lastLogin')
        .where('lh.accountId IN (:...ids)', { ids: accountIds })
        .groupBy('lh.accountId')
        .getRawMany(),
    ]);

    const sessionMap = Object.fromEntries(sessionCounts.map(s => [s.userId, Number(s.totalSessions)]));
    const loginMap = Object.fromEntries(lastLogins.map(l => [l.accountId, l.lastLogin]));

    const enriched = result.map(r => ({
      ...r,
      totalSessions: sessionMap[r.id] || 0,
      lastLogin: loginMap[r.id] || null,
    }));

    return { result: enriched, total };
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
        'tutorDetail.trailRate',
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

  async getStaffFullDetails(accountId: string) {
    const account = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .leftJoinAndSelect('staffDetail.designation', 'designation')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',
        'account.updatedAt',
        'staffDetail.id',
        'staffDetail.name',
        'staffDetail.dob',
        'staffDetail.gender',
        'staffDetail.city',
        'staffDetail.state',
        'staffDetail.country',
        'staffDetail.pin',
        'staffDetail.designationId',
        'staffDetail.createdAt',
        'staffDetail.updatedAt',
        'designation.id',
        'designation.name',
      ])
      .where('account.id = :accountId AND account.roles = :roles', {
        accountId,
        roles: UserRole.STAFF,
      })
      .getOne();

    if (!account) {
      throw new NotFoundException('Staff account not found!');
    }

    const loginHistory = await this.loginHistoryRepo
      .createQueryBuilder('loginHistory')
      .select([
        'loginHistory.id',
        'loginHistory.loginTime',
        'loginHistory.logoutTime',
        'loginHistory.ip',
      ])
      .where('loginHistory.accountId = :accountId', { accountId })
      .orderBy('loginHistory.loginTime', 'DESC')
      .take(20)
      .getMany();

    return { account, loginHistory };
  }

  async getStaffDetails(dto: StaffPaginationDto) {
    const keyword = (dto.keyword || '').trim();
    const query = this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .leftJoinAndSelect('staffDetail.designation', 'designation')
      .select([
        'account.id',
        'account.phoneNumber',
        'account.email',
        'account.password',
        'account.roles',
        'account.status',
        'account.createdAt',
        'staffDetail.id',
        'staffDetail.name',
        'staffDetail.dob',
        'staffDetail.createdAt',
        'designation.id',
        'designation.name',
      ])
      .where('account.roles = :roles', { roles: UserRole.STAFF });

    if (dto.status) {
      query.andWhere('account.status = :status', { status: dto.status });
    }

    if (dto.designationId) {
      query.andWhere('staffDetail.designationId = :designationId', { designationId: dto.designationId });
    }

    const [result, total] = await query
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            'account.phoneNumber LIKE :keyword OR account.email LIKE :keyword OR staffDetail.name LIKE :keyword',
            { keyword: '%' + keyword + '%' },
          );
        }),
      )
      .orderBy({ 'staffDetail.name': 'ASC' })
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async getCurrentUserProfile(accountId: string) {
    const account = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .leftJoinAndSelect('staffDetail.designation', 'designation')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',
        'account.updatedAt',
        'staffDetail.id',
        'staffDetail.name',
        'staffDetail.dob',
        'staffDetail.gender',
        'staffDetail.city',
        'staffDetail.state',
        'staffDetail.country',
        'staffDetail.pin',
        'staffDetail.designationId',
        'staffDetail.createdAt',
        'staffDetail.updatedAt',
        'designation.id',
        'designation.name',

      ])
      .where('account.id = :accountId', { accountId })
      .getOne();

    if (!account) {
      throw new NotFoundException('Account not found!');
    }

    const perms = await this.menuRepo
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.userPermission', 'userPermission')
      .leftJoinAndSelect('userPermission.permission', 'permission')
      .select([
        'menu.id',
        'menu.name',
        'menu.title',
        'userPermission.id',
        'userPermission.status',
        'permission.id',
        'permission.name',
      ])
      .where('userPermission.accountId = :accountId', { accountId })
      .orderBy({ 'menu.title': 'ASC', 'permission.id': 'ASC' })
      .getMany();

    return { account, perms };
  }

  async getStaffProfile(accountId: string) {
    const rawPerms = await this.menuRepo
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.userPermission', 'userPermission')
      .leftJoinAndSelect('userPermission.permission', 'permission')
      .select([
        'menu.id',
        'menu.title',
        'userPermission.id',
        'userPermission.accountId',
        'userPermission.permissionId',
        'userPermission.status',
        'permission.id',
        'permission.name',
      ])
      .where('userPermission.accountId = :accountId', { accountId })
      .orderBy({ 'menu.title': 'ASC', 'permission.id': 'ASC' })
      .getMany();
    const perms = rawPerms.map((menu) => ({
      ...menu,
      status: menu.userPermission?.some((up) => up.status === true) ?? false,
    }));
    return { perms };
  }

  async getStaffDetailByAccount(accountId: string) {
    const result = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.staffDetail', 'staffDetail')
      .leftJoinAndSelect('staffDetail.designation','designation')
      .select([
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.password',
        'account.roles',
        'account.status',
        'account.createdAt',
        'account.updatedAt',
        'staffDetail.id',
        'staffDetail.name',
        'staffDetail.dob',
        'staffDetail.gender',
        'staffDetail.city',
        'staffDetail.state',
        'staffDetail.country',
        'staffDetail.pin',
        'staffDetail.createdAt',
        'staffDetail.updatedAt',
        'designation.id',
        'designation.name',
        
      ])
      .where('account.id = :accountId AND account.roles = :roles', {
        accountId,
        roles: UserRole.STAFF,
      })
      .getOne();

    if (!result) {
      throw new NotFoundException('Staff account not found!');
    }
    return result;
  }

  async updateStaff(accountId: string, dto: UpdateStaffDto) {
    const result = await this.staffRepo.findOne({ where: { accountId } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    Object.assign(result, dto);
    return this.staffRepo.save(result);
  }

  async updateMyPassword(accountId: string, dto: UpdateMyPasswordDto) {
    const account = await this.repo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found!');
    }
    const isMatch = await bcrypt.compare(dto.currentPassword, account.password);
    if (!isMatch) {
      throw new ConflictException('Current password is incorrect!');
    }
    account.password = await bcrypt.hash(dto.newPassword, 10);
    await this.repo.save(account);
    return { message: 'Password updated successfully!' };
  }

  async updateStaffPassword(accountId: string, dto: UpdateStaffPasswordDto) {
    const result = await this.repo.findOne({ where: { id: accountId } });
    if (!result) {
      throw new NotFoundException('Account Not Found With This ID.');
    }
    if (dto.email && dto.email.length > 0) {
      const obj = Object.assign(result, { email: dto.email });
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

    const changesList: string[] = [];
    if (dto.email && dto.email !== result.email) changesList.push('Email address was updated');
    if (dto.phoneNumber && dto.phoneNumber !== result.phoneNumber) changesList.push('Phone number was updated');

    const obj = { ...result, ...dto };
    const updated = await this.repo.save(obj);

    if (changesList.length > 0) {
      const emailTo = dto.email || result.email;
      if (emailTo) {
        const detailRepo = result.roles === UserRole.TUTOR ? this.tutorRepo
          : result.roles === UserRole.STAFF ? this.staffRepo
          : this.udRepo;
        const detail = await (detailRepo as any).findOne({ where: { accountId: id } });
        const firstName = detail?.name?.split(' ')[0] || 'User';
        this.nodeMailerService.sendProfileUpdateEmail(emailTo, firstName, changesList).catch(() => {});
      }
    }

    return updated;
  }

  async getTutorFullDetails(accountId: string) {
    const tutorDetail = await this.tutorRepo
      .createQueryBuilder('tutorDetail')
      .leftJoinAndSelect('tutorDetail.account', 'account')
      .leftJoinAndSelect('tutorDetail.subject', 'subject')
      .leftJoinAndSelect('tutorDetail.tutorSubjects', 'tutorSubjects')
      .leftJoinAndSelect('tutorSubjects.subject', 'tsSubject')
      .leftJoinAndSelect('tutorDetail.city', 'city')
      .leftJoinAndSelect('tutorDetail.state', 'state')
      .leftJoinAndSelect('tutorDetail.country', 'country')
      .leftJoinAndSelect('tutorDetail.language', 'language')
      .leftJoinAndSelect('tutorDetail.qualification', 'qualification')
      .leftJoinAndSelect('tutorDetail.budget', 'budget')
      .select([
        'tutorDetail.id',
        'tutorDetail.name',
        'tutorDetail.tutorId',
        'tutorDetail.gender',
        'tutorDetail.expertiseLevel',
        'tutorDetail.dob',
        'tutorDetail.profileImage',
        'tutorDetail.profileImagePath',
        'tutorDetail.document',
        'tutorDetail.documentName',
        'tutorDetail.qualificationCertification',
        'tutorDetail.qualificationCertificationName',
        'tutorDetail.bio',
        'tutorDetail.averageRating',
        'tutorDetail.totalRatings',
        'tutorDetail.hourlyRate',
        'tutorDetail.trailRate',
        'tutorDetail.teachingExperience',
        'tutorDetail.languageProficiency',
        'tutorDetail.introductionVideo',
        'tutorDetail.introductionVideoPath',
        'tutorDetail.createdAt',
        'tutorDetail.updatedAt',
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',
        'subject.id', 'subject.name',
        'tutorSubjects.id',
        'tsSubject.id', 'tsSubject.name',
        'city.id', 'city.name',
        'state.id', 'state.name',
        'country.id', 'country.name',
        'language.id', 'language.name',
        'qualification.id', 'qualification.name',
        'budget.id', 'budget.min', 'budget.max',
      ])
      .where('tutorDetail.accountId = :accountId', { accountId })
      .getOne();

    if (!tutorDetail) {
      throw new NotFoundException('Tutor not found!');
    }

    const bankDetails = await this.bankRepo.find({ where: { tutorId: accountId } });

    const wallet = await this.walletRepo.findOne({ where: { accountId } });

    const walletTransactions = wallet
      ? await this.walletTxRepo.find({
          where: { accountId },
          order: { createdAt: 'DESC' },
        })
      : [];

    return { tutorDetail, bankDetails, wallet, walletTransactions };
  }

  async getUserFullDetails(accountId: string) {
    const account = await this.repo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .leftJoinAndSelect('userDetail.topic', 'topic')
      .leftJoinAndSelect('userDetail.goal', 'goal')
      .leftJoinAndSelect('userDetail.country', 'country')
      .leftJoinAndSelect('userDetail.language', 'language')
      .leftJoinAndSelect('userDetail.budget', 'budget')
      .select([
        'account.id', 'account.email', 'account.phoneNumber',
        'account.roles', 'account.status', 'account.createdAt',
        'userDetail.id', 'userDetail.name', 'userDetail.gender',
        'userDetail.dob', 'userDetail.address', 'userDetail.profile',
        'userDetail.englishLevel', 'userDetail.createdAt',
        'topic.id', 'topic.name',
        'goal.id', 'goal.name',
        'country.id', 'country.name',
        'language.id', 'language.name',
        'budget.id', 'budget.min', 'budget.max',
      ])
      .where('account.id = :accountId', { accountId })
      .getOne();

    if (!account) throw new NotFoundException('User not found!');

    const wallet = await this.walletRepo.findOne({ where: { accountId } });

    // const walletTransactions = wallet
    //   ? await this.walletTxRepo.find({ where: { accountId }, order: { createdAt: 'DESC' }, take: 20 })
    //   : [];

    // const sessions = await this.sessionRepo
    //   .createQueryBuilder('session')
    //   .leftJoin('session.tutor', 'tutor')
    //   .leftJoin('tutor.tutorDetail', 'tutorDetail')
    //   .select([
    //     'session.id', 'session.sessionDate', 'session.startTime', 'session.endTime',
    //     'session.duration', 'session.amount', 'session.status', 'session.sessionType',
    //     'session.createdAt',
    //     'tutor.id', 'tutor.email',
    //     'tutorDetail.name', 'tutorDetail.profileImage',
    //   ])
    //   .where('session.userId = :accountId', { accountId })
    //   .orderBy('session.createdAt', 'DESC')
    //   .take(20)
    //   .getMany();

    // const purchases = await this.purchaseRepo
    //   .createQueryBuilder('purchase')
    //   .leftJoin('purchase.course', 'course')
    //   .select([
    //     'purchase.id', 'purchase.purchaseType', 'purchase.amount',
    //     'purchase.paymentStatus', 'purchase.status', 'purchase.orderNumber',
    //     'purchase.paidAt', 'purchase.createdAt',
    //     'course.id', 'course.name',
    //   ])
    //   .where('purchase.accountId = :accountId', { accountId })
    //   .orderBy('purchase.createdAt', 'DESC')
    //   .take(20)
    //   .getMany();

    return { account, wallet,  };
  }

  async generateAllTutorsPdf(res: Response) {
    const { result: tutors } = await this.getAllTutors({ limit: 1000, offset: 0 } as any);
    PdfUtils.generateTutorsPdf(tutors, res);
  }

  async generateAllUsersPdf(res: Response) {
    const { result: users } = await this.getAllUsers({ limit: 1000, offset: 0 } as any);
    PdfUtils.generateUsersPdf(users, res);
  }

  private async generateStaffId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA').split('-').join('');
    const prefix = 'WIZ_ADM_';

    const lastStaff = await this.staffRepo
      .createQueryBuilder('staff')
      .where('staff.staffId LIKE :pattern', { pattern: `${prefix}%/%` })
      .orderBy('staff.staffId', 'DESC')
      .getOne();

    let sequence = 1;
    const lastSequence = lastStaff?.staffId
      ? Number.parseInt(lastStaff.staffId.split('/')[1], 10)
      : Number.NaN;

    if (!Number.isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }

    return `${prefix}${dateStr}/${String(sequence).padStart(4, '0')}`;
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

  async exportStudentsCsv(dto: ExportStudentsCsvDto): Promise<{ csv: string; fileName: string }> {
    const { startDate, endDate } = this.resolveDateRange(dto);

    const qb = this.repo.createQueryBuilder('account')
      .leftJoinAndSelect('account.userDetail', 'userDetail')
      .leftJoinAndSelect('userDetail.country', 'country')
      .where('account.roles = :role', { role: UserRole.USER });

    if (startDate) qb.andWhere('account.createdAt >= :startDate', { startDate });
    if (endDate)   qb.andWhere('account.createdAt <= :endDate',   { endDate });
    qb.orderBy('account.createdAt', 'DESC');

    const students = await qb.getMany();

    const ud = (r: any) => Array.isArray(r.userDetail) ? r.userDetail[0] : r.userDetail;
    const columns: CsvColumn[] = [
      { header: 'Student ID',        value: r => ud(r)?.userId || '' },
      { header: 'Name',              value: r => ud(r)?.name || '' },
      { header: 'Email',             value: r => r.email || '' },
      { header: 'Phone',             value: r => r.phoneNumber || '' },
      { header: 'Gender',            value: r => ud(r)?.gender || '' },
      { header: 'Country',           value: r => ud(r)?.country?.name || '' },
      { header: 'Status',            value: r => r.status || '' },
      { header: 'Registration Date', value: r => formatCsvDate(r.createdAt) },
    ];
    const csv      = buildCsv(columns, students);
    const fileName = generateCsvFileName('wiznovy-students-export');
    return { csv, fileName };
  }

  private resolveDateRange(dto: ExportStudentsCsvDto): { startDate: Date | null; endDate: Date | null } {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dto.preset) {
      case DateRangePreset.THIS_WEEK: {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        return { startDate: start, endDate: now };
      }
      case DateRangePreset.LAST_WEEK: {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      case DateRangePreset.LAST_MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      case DateRangePreset.LAST_3_MONTHS: {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { startDate: start, endDate: now };
      }
      case DateRangePreset.CUSTOM:
        return {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate:   dto.endDate   ? new Date(dto.endDate)   : null,
        };
      default:
        return { startDate: null, endDate: null };
    }
  }

  async exportTutorsCsv(dto: ExportStudentsCsvDto): Promise<{ csv: string; fileName: string }> {
    const { startDate, endDate } = this.resolveDateRange(dto);

    const qb = this.repo.createQueryBuilder('account')
      .leftJoinAndSelect('account.tutorDetail', 'tutorDetail')
      .leftJoinAndSelect('tutorDetail.subject', 'subject')
      .leftJoinAndSelect('tutorDetail.country', 'country')
      .where('account.roles = :role', { role: UserRole.TUTOR });

    if (startDate) qb.andWhere('account.createdAt >= :startDate', { startDate });
    if (endDate)   qb.andWhere('account.createdAt <= :endDate',   { endDate });
    qb.orderBy('account.createdAt', 'DESC');

    const tutors = await qb.getMany();

    const td = (r: any) => Array.isArray(r.tutorDetail) ? r.tutorDetail[0] : r.tutorDetail;
    const columns: CsvColumn[] = [
      { header: 'Tutor ID',          value: r => td(r)?.tutorId || '' },
      { header: 'Name',              value: r => td(r)?.name || '' },
      { header: 'Email',             value: r => r.email || '' },
      { header: 'Phone',             value: r => r.phoneNumber || '' },
      { header: 'Gender',            value: r => td(r)?.gender || '' },
      { header: 'Country',           value: r => td(r)?.country?.name || '' },
      { header: 'Subject',           value: r => td(r)?.subject?.name || '' },
      { header: 'Rating',            value: r => td(r)?.averageRating ?? '' },
      { header: 'Hourly Rate',       value: r => td(r)?.hourlyRate ?? '' },
      { header: 'Status',            value: r => r.status || '' },
      { header: 'Registration Date', value: r => formatCsvDate(r.createdAt) },
    ];

    const csv      = buildCsv(columns, tutors);
    const fileName = generateCsvFileName('wiznovy-tutors-export');
    return { csv, fileName };
  }
}

