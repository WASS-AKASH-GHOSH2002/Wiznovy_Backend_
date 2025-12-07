import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Like, Repository } from 'typeorm';
import { SettingDto } from './dto/setting.dto';
import { Setting } from './entities/setting.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting) private readonly repo: Repository<Setting>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async find() {
    return this.repo.createQueryBuilder('setting').getOne();
  }

  async findSettingByAdmin() {
    const [result, total] = await this.repo
      .createQueryBuilder('setting')
      .getManyAndCount();
    return { result, total };
  }

  async findSetting() {
    return this.repo.createQueryBuilder('setting').getOne();
  }

  async update(dto: SettingDto) {
    const result = await this.repo.createQueryBuilder('setting').getOne();
    const obj = Object.assign(result, dto);
    return this.repo.save(obj);
  }

  async logo(image: string, result: Setting) {
    if (result.logoPath) {
      const oldPath = join(__dirname, '..', '..', result.logoPath);
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
      logo: process.env.SWC_CDN_LINK + image,
      logoPath: image,
    });
    return this.repo.save(obj);
  }
}
