import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu) private readonly repo: Repository<Menu>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll() {
    let menus: Menu[] = await this.cacheManager.get('menus');
    if (!menus) {
      menus = await this.repo.find();
      this.cacheManager.set('menus', menus, 0);
    }
    return menus;
  }
}
