import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Setting } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SessionSettings } from './entities/session-settings.entity';
import { CancellationSettings } from './entities/cancellation-settings.entity';
import { RescheduleSettings } from './entities/reschedule-settings.entity';
import { UpdateSessionSettingsDto } from './dto/update-session-settings.dto';
import { UpdateCancellationSettingsDto } from './dto/update-cancellation-settings.dto';
import { UpdateRescheduleSettingsDto } from './dto/update-reschedule-settings.dto';

@Injectable()
export class SettingsService {
  private readonly CACHE_KEY = 'app_settings';
  private readonly CACHE_TTL = 300; 

  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
    @InjectRepository(SessionSettings)
    private readonly sessionSettingsRepo: Repository<SessionSettings>,
    @InjectRepository(CancellationSettings)
    private readonly cancellationSettingsRepo: Repository<CancellationSettings>,
    @InjectRepository(RescheduleSettings)
    private readonly rescheduleSettingsRepo: Repository<RescheduleSettings>,
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
      apiKey: settings?.zoom_client_id || process.env.ZOOM_API_KEY,
      apiSecret: settings?.zoom_client_secret || process.env.ZOOM_API_SECRET,
      accountId: settings?.zoom_account_id || process.env.ZOOM_ACCOUNT_ID,
      enabled: !!(settings?.zoom_account_id || process.env.ZOOM_ACCOUNT_ID),
    };
  }

  async getStripeConfig() {
    const settings = await this.getSettings();
    return {
      publicKey: settings?.stripe_publishable_key || process.env.STRIPE_PUBLIC_KEY,
      secretKey: settings?.stripe_secret_key || process.env.STRIPE_SECRET_KEY,
      webhookSecret: settings?.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!(settings?.stripe_secret_key || process.env.STRIPE_SECRET_KEY),
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

  private readonly SESSION_CACHE_KEY = 'session_settings';

  async getSessionSettings(): Promise<SessionSettings> {
    let settings = await this.cacheManager.get<SessionSettings>(this.SESSION_CACHE_KEY);

    if (!settings) {
      settings = await this.sessionSettingsRepo
        .createQueryBuilder('sessionSettings')
        .select([
          'sessionSettings.id',
          'sessionSettings.trial_duration_minutes',
          'sessionSettings.regular_session_duration_minutes',
          'sessionSettings.session_buffer_minutes',
          'sessionSettings.trial_commission_percent',
          'sessionSettings.max_trials_per_student_tutor',
          'sessionSettings.createdAt',
          'sessionSettings.updatedAt',
        ])
        .getOne();

      if (settings) {
        await this.cacheManager.set(this.SESSION_CACHE_KEY, settings, this.CACHE_TTL);
      }
    }

    return settings;
  }

  private readonly CANCELLATION_CACHE_KEY = 'cancellation_settings';

  async getCancellationSettings(): Promise<CancellationSettings> {
    let settings = await this.cacheManager.get<CancellationSettings>(this.CANCELLATION_CACHE_KEY);

    if (!settings) {
      settings = await this.cancellationSettingsRepo
        .createQueryBuilder('cancellationSettings')
        .select([
          'cancellationSettings.id',
          'cancellationSettings.early_cancel_threshold_hours',
          'cancellationSettings.mid_cancel_threshold_hours',
          'cancellationSettings.early_cancel_refund_percent',
          'cancellationSettings.mid_cancel_credit_percent',
          'cancellationSettings.late_cancel_credit_percent',
          'cancellationSettings.cancel_commission_percent',
          'cancellationSettings.tutor_self_cancel_min_notice_hours',
          'cancellationSettings.createdAt',
          'cancellationSettings.updatedAt',
        ])
        .getOne();

      if (settings) {
        await this.cacheManager.set(this.CANCELLATION_CACHE_KEY, settings, this.CACHE_TTL);
      }
    }

    return settings;
  }

  private readonly RESCHEDULE_CACHE_KEY = 'reschedule_settings';

  async getRescheduleSettings(): Promise<RescheduleSettings> {
    let settings = await this.cacheManager.get<RescheduleSettings>(this.RESCHEDULE_CACHE_KEY);

    if (!settings) {
      settings = await this.rescheduleSettingsRepo
        .createQueryBuilder('rescheduleSettings')
        .select([
          'rescheduleSettings.id',
          'rescheduleSettings.reschedule_early_threshold_hours',
          'rescheduleSettings.reschedule_mid_threshold_hours',
          'rescheduleSettings.reschedule_block_threshold_hours',
          'rescheduleSettings.reschedule_early_fee_percent',
          'rescheduleSettings.reschedule_mid_fee_percent',
          'rescheduleSettings.reschedule_late_fee_percent',
          'rescheduleSettings.max_reschedules_per_session',
          'rescheduleSettings.reschedule_fee_destination',
          'rescheduleSettings.max_advance_booking_days',
          'rescheduleSettings.tutor_reschedule_min_notice_hours',
          'rescheduleSettings.createdAt',
          'rescheduleSettings.updatedAt',
        ])
        .getOne();

      if (settings) {
        await this.cacheManager.set(this.RESCHEDULE_CACHE_KEY, settings, this.CACHE_TTL);
      }
    }

    return settings;
  }

  async refreshCache() {
    await this.cacheManager.del(this.CACHE_KEY);
  }

  async updateSessionSettings(id: string, dto: UpdateSessionSettingsDto) {
    let settings = await this.sessionSettingsRepo.findOne({ where: { id } });
    if (!settings) throw new NotFoundException('Session settings not found');
    Object.assign(settings, dto);
    const result = await this.sessionSettingsRepo.save(settings);
    await this.cacheManager.del(this.SESSION_CACHE_KEY);
    return result;
  }

  async updateCancellationSettings(id: string, dto: UpdateCancellationSettingsDto) {
    let settings = await this.cancellationSettingsRepo.findOne({ where: { id } });
    if (!settings) throw new NotFoundException('Cancellation settings not found');
    Object.assign(settings, dto);
    const result = await this.cancellationSettingsRepo.save(settings);
    await this.cacheManager.del(this.CANCELLATION_CACHE_KEY);
    return result;
  }

  async updateRescheduleSettings(id: string, dto: UpdateRescheduleSettingsDto) {
    let settings = await this.rescheduleSettingsRepo.findOne({ where: { id } });
    if (!settings) throw new NotFoundException('Reschedule settings not found');
    Object.assign(settings, dto);
    const result = await this.rescheduleSettingsRepo.save(settings);
    await this.cacheManager.del(this.RESCHEDULE_CACHE_KEY);
    return result;
  }

  async uploadLogo(id: string, file: Express.Multer.File) {
    const settings = await this.repo.findOne({ where: { id } });
    if (!settings) throw new NotFoundException(`Settings with ID ${id} not found`);

    if (settings.logoPath) {
      const { unlink } = await import('node:fs/promises');
      const { join } = await import('node:path');
      await unlink(join(process.cwd(), settings.logoPath)).catch(() => null);
    }

    settings.logo = process.env.WIZNOVY_CDN_LINK + file.path;
    settings.logoPath = file.path;
    const result = await this.repo.save(settings);
    await this.refreshCache();
    return { logo: result.logo, logoPath: result.logoPath };
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

  async findPublicSettings() {
    const settings = await this.repo
      .createQueryBuilder('setting')
      .select([
        'setting.id',
        'setting.title',
        'setting.email',
        'setting.domain',
        'setting.logo',
        'setting.logoPath',
        'setting.wpLink',
        'setting.fbLink',
        'setting.instaLink',
        'setting.companyName',
        'setting.companyYear',
        'setting.companyAddress',
        'setting.companyCity',
        'setting.companyPhone',
        'setting.companyGstin',
        'setting.gstPercentage',
        'setting.sessionCommissionRate',
        'setting.courseCommissionRate',
        'setting.language',
        'setting.timezone',
        'setting.currency',
        'setting.status',
        'setting.stripe_publishable_key',
        'setting.emailEnabled',
        'setting.pdfMargin',
        'setting.invoiceDeclaration',
        'setting.createdAt',
        'setting.updatedAt',
      ])
      .getOne();

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    return settings;
  }
}