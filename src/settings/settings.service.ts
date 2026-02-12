import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Setting } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly CACHE_KEY = 'app_settings';
  private readonly CACHE_TTL = 300; 

  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    console.log('SettingsService constructor called');
  }

  async getSettings(): Promise<Setting> {
    let settings = await this.cacheManager.get<Setting>(this.CACHE_KEY);
    
    if (!settings) {
      settings = await this.repo.findOne({ where: {} });
      if (settings) {
        await this.cacheManager.set(this.CACHE_KEY, settings, this.CACHE_TTL);
      }
    }
    
    return settings;
  }

  async getZoomConfig() {
    const settings = await this.getSettings();
    return {
      apiKey: settings?.zoomApiKey || process.env.ZOOM_API_KEY,
      apiSecret: settings?.zoomApiSecret || process.env.ZOOM_API_SECRET,
      enabled: settings?.zoomEnabled ?? true
    };
  }

  async getStripeConfig() {
    const settings = await this.getSettings();
    return {
      publicKey: settings?.stripePublicKey || process.env.STRIPE_PUBLIC_KEY,
      secretKey: settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
      enabled: settings?.stripeEnabled ?? true
    };
  }

  async getEmailConfig() {
    
    const settings = await this.getSettings();
    const user = settings?.emailUser || process.env.EMAIL_USER || process.env.RN_EMAIL;
    const password = settings?.emailPassword || process.env.EMAIL_PASSWORD;
    
    
    if (!user || !password) {
      throw new BadRequestException('Email credentials not configured. Please set emailUser and emailPassword in settings or environment variables.');
    }
    
    return {
      host: settings?.emailHost || process.env.EMAIL_HOST,
      port: settings?.emailPort || Number.parseInt(process.env.EMAIL_PORT),
      user,
      password,
      enabled: settings?.emailEnabled ?? true
    };
  }

  async refreshCache() {
    await this.cacheManager.del(this.CACHE_KEY);
  }

  async updateSettings(id: string, dto: UpdateSettingsDto) {
    if (!id) {
      throw new BadRequestException('Settings ID is required');
    }

    let settings = await this.repo.findOne({ where: { id } });
    
    if (!settings) {
      throw new NotFoundException(`Settings with ID ${id} not found`);
    }
    
    Object.assign(settings, dto);
    
    const result = await this.repo.save(settings);
    await this.refreshCache();
    return result;
  }

  async findSettings() {
    const settings = await this.getSettings();
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    return settings;
  }
}