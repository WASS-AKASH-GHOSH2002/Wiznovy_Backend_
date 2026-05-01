import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import {
  CreateUserPermissionDto,
  UpdateUserPermissionDto,
} from './dto/permission.dto';
import { UserPermission } from './entities/user-permission.entity';
import { BoolStatusDto } from 'src/common/dto/bool-status.dto';

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly repo: Repository<UserPermission>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async create(dto: CreateUserPermissionDto[]) {
    return this.repo.save(dto);
  }

  async getAllPermissionsByAccount(accountId: string) {
    const result = await this.repo
      .createQueryBuilder('userPermission')
      .leftJoinAndSelect('userPermission.permission', 'permission')
      .leftJoinAndSelect('userPermission.menu', 'menu')
      .where('userPermission.accountId = :accountId', { accountId })
      .select([
        'userPermission.id',
        'userPermission.status',
        'userPermission.menuId',
        'userPermission.permissionId',
        'permission.id',
        'permission.name',
        'menu.id',
        'menu.name',
        'menu.title',
      ])
      .getMany();

    const grouped = result.reduce((acc, item) => {
      const menuId = item.menuId;
      if (!acc[menuId]) {
        acc[menuId] = {
          menuId: item.menu?.['id'],
          menuName: item.menu?.['name'],
          menuTitle: item.menu?.['title'],
          permissions: []
        };
      }
      acc[menuId].permissions.push({
        id: item.id,
        permissionId: item.permissionId,
        permissionName: item.permission?.['name'],
        status: item.status
      });
      return acc;
    }, {});

    return { result: Object.values(grouped) };
  }

  async getPermission(menuId: string, accountId: string) {
    const result = await this.repo
      .createQueryBuilder('userPermssion')
      .leftJoinAndSelect('userPermssion.permission', 'permission')
      .where(
        'userPermssion.menuId = :menuId AND userPermssion.accountId = :accountId',
        { menuId: menuId, accountId: accountId },
      )
      .getMany();
    return { result };
  }

  async update(dto: UpdateUserPermissionDto[]) {
    try {
      const result = await this.repo.save(dto);
      const accountIds = [...new Set(dto.map((p) => p.accountId).filter(Boolean))];
      await Promise.all(accountIds.map((id) => this.cacheManager.del('userPermission' + id)));
      return result;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw new NotAcceptableException(
        'Something bad happened! Try after some time!',
      );
    }
  }

  async status(id: number, dto: BoolStatusDto) {
    const permission = await this.repo.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException('User-Permission not found!');
    }
    const obj = Object.assign(permission, dto);
    const result = await this.repo.save(obj);
    await this.cacheManager.del('userPermission' + permission.accountId);
    return result;
  }
}
