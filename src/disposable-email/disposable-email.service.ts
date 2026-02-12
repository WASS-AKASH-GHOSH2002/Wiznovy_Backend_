import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DisposableEmailDomain } from './entities/disposable-email-domain.entity';
import { CreateDisposableEmailDomainDto, UpdateDisposableEmailDomainDto, DisposableEmailPaginationDto, BulkDisposableEmailStatusDto } from './dto/disposable-email-domain.dto';
import { DefaultStatus } from 'src/enum';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';

@Injectable()
export class DisposableEmailService {
  private readonly CACHE_KEY = 'disposable_email_domains';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(DisposableEmailDomain)
    private readonly repo: Repository<DisposableEmailDomain>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(dto: CreateDisposableEmailDomainDto) {
    const domain = dto.domain.toLowerCase().trim();
    
    const existing = await this.repo.findOne({ where: { domain } });
    if (existing) {
      throw new ConflictException('Domain already exists');
    }

    const result = await this.repo.save({ domain });
    await this.refreshCache();
    return result;
  }

  async findAll(dto: DisposableEmailPaginationDto) {
    const queryBuilder = this.repo.createQueryBuilder('domain');

    if (dto.status) {
      queryBuilder.where('domain.status = :status', { status: dto.status });
    }

    if (dto.keyword) {
      queryBuilder.andWhere('domain.domain LIKE :keyword', { keyword: `%${dto.keyword}%` });
    }

    const [result, total] = await queryBuilder
      .orderBy('domain.createdAt', 'DESC')
      .skip(dto.offset)
      .take(dto.limit)
      .getManyAndCount();

    return { result, total };
  }

  async findOne(id: string) {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) {
      throw new NotFoundException('Domain not found');
    }
    return result;
  }

  async update(id: string, dto: UpdateDisposableEmailDomainDto) {
    const domain = await this.findOne(id);
    
    if (dto.domain) {
      const existing = await this.repo.findOne({ 
        where: { domain: dto.domain.toLowerCase().trim() } 
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Domain already exists');
      }
      dto.domain = dto.domain.toLowerCase().trim();
    }

    Object.assign(domain, dto);
    const result = await this.repo.save(domain);
    await this.refreshCache();
    return result;
  }

  async updateStatus(id: string, dto: DefaultStatusDto) {
    const domain = await this.findOne(id);
    domain.status = dto.status;
    const result = await this.repo.save(domain);
    await this.refreshCache();
    return result;
  }

  async bulkUpdateStatus(dto: BulkDisposableEmailStatusDto) {
    await this.repo.update({ id: In(dto.ids) }, { status: dto.status });
    await this.refreshCache();
    return { message: 'Status updated successfully' };
  }

  async remove(id: string) {
    const domain = await this.findOne(id);
    await this.repo.remove(domain);
    await this.refreshCache();
    return { message: 'Domain deleted successfully' };
  }

  async isDisposableEmail(email: string): Promise<boolean> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const disposableDomains = await this.getDisposableDomains();
    return disposableDomains.includes(domain);
  }

  private async getDisposableDomains(): Promise<string[]> {
    let domains = await this.cacheManager.get<string[]>(this.CACHE_KEY);
    
    if (!domains) {
      const result = await this.repo.find({
        where: { status: DefaultStatus.ACTIVE },
        select: ['domain']
      });
      domains = result.map(d => d.domain);
      await this.cacheManager.set(this.CACHE_KEY, domains, this.CACHE_TTL);
    }
    
    return domains;
  }

  private async refreshCache() {
    await this.cacheManager.del(this.CACHE_KEY);
    await this.getDisposableDomains(); // Rebuild cache
  }
}