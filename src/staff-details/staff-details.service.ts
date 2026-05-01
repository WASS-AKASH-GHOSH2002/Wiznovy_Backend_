import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Menu } from 'src/menus/entities/menu.entity';
import { Repository } from 'typeorm';
import { StaffDetailDto, UpdateStaffDetailDto } from './dto/staff-detail.dto';
import { StaffDetail } from './entities/staff-detail.entity';

@Injectable()
export class StaffDetailsService {
  constructor(
    @InjectRepository(StaffDetail)
    private readonly repo: Repository<StaffDetail>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(dto: StaffDetailDto) {
    const user = await this.repo.findOne({
      where: { accountId: dto.accountId },
    });

    if (user) {
      try {
        const obj = Object.assign(user, dto);
        return this.repo.save(obj);
      } catch (error) {
        console.error('Error updating existing staff detail:', error);
        throw new NotAcceptableException(
          'Either duplicate email or invalid details!',
        );
      }
    } else {
      try {
        const obj = Object.create(dto);
        return this.repo.save(obj);
      } catch (error) {
        console.error('Error creating new staff detail:', error);
        throw new NotAcceptableException(
          'Either duplicate email or invalid details!',
        );
      }
    }
  }

  async updateByAdmin(accountId: string, dto: UpdateStaffDetailDto, adminId: string) {
    const user = await this.repo.findOne({ where: { accountId } });
    if (!user) {
      throw new NotFoundException('Staff account not found!');
    }
    dto.updatedBy = adminId;
    this.delStaffDetail(accountId);
    const obj = Object.assign(user, dto);
    return this.repo.save(obj);
  }

  async update(accountId: string, dto: UpdateStaffDetailDto) {
    const user = await this.repo.findOne({ where: { accountId } });
    if (!user) {
      throw new NotFoundException('Account not found!');
    }
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async findOne(accountId: string) {
    const user = await this.repo.findOne({ where: { accountId } });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }

  async findByAccount(accountId: string) {
    const staffDetail = await this.repo
      .createQueryBuilder('staffDetail')
      .leftJoinAndSelect('staffDetail.account', 'account')
      .leftJoinAndSelect('staffDetail.designation', 'designation')
      .select([
        'staffDetail',
        'account.id',
        'account.email',
        'account.phoneNumber',
        'account.roles',
        'account.status',
        'account.createdAt',
        'designation.id',
        'designation.name',
      ])
      .where('staffDetail.accountId = :accountId', { accountId })
      .getOne();

    if (!staffDetail) {
      throw new NotFoundException('Staff details not found!');
    }
    return staffDetail;
  }

  profile(id: string) {
    return this.getStaffDetail(id);
  }

  private delStaffDetail(id: string) {
    this.cacheManager.del('staffDetail' + id);
  }

  private async getStaffDetail(id: string) {
    let user = await this.cacheManager.get('staffDetail' + id);
    if (!user) {
      user = await this.repo
        .createQueryBuilder('staffDetail')
        .leftJoinAndSelect('staffDetail.account', 'account')
        .where('staffDetail.accountId = :accountId', { accountId: id })
        .getOne();
      this.cacheManager.set('staffDetail' + id, user, 6 * 60 * 60 * 1000);
    }
    if (!user) {
      throw new NotFoundException('Account details not found!');
    }
    let perms = await this.cacheManager.get('staffDetailPerms' + id);
    if (!perms) {
      perms = await this.menuRepo
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.userPermission', 'userPermission')
        .leftJoinAndSelect('userPermission.permission', 'permission')
        .where('userPermission.accountId = :accountId', { accountId: id })
        .orderBy({ 'menu.title': 'ASC', 'permission.id': 'ASC' })
        .getMany();
      this.cacheManager.set('staffDetailPerms' + id, perms, 6 * 60 * 60 * 1000);
    }

    return { user, perms };
  }
}
