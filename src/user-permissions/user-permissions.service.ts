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
      this.delPermissions(dto[0].accountId);
      return this.repo.save(dto);
    } catch (error) {
      throw new NotAcceptableException(
        'Something bad happened! Try after some time!',
      );
    }
  }

  private delPermissions(id: string) {
    this.cacheManager.del('userPermission' + id);
  }

  async status(id: number, dto: BoolStatusDto) {
    
    const permission = await this.repo.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException('User-Permission not found!');
    }
    const obj = Object.assign(permission, dto);
    return this.repo.save(obj);
  }
}
