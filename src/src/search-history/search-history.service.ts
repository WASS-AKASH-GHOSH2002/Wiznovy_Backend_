import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from './entities/search-history.entity';
import { CreateSearchHistoryDto } from './dto/create-search-history.dto';

@Injectable()
export class SearchHistoryService {
  constructor(
    @InjectRepository(SearchHistory)
    private searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  async create(dto: CreateSearchHistoryDto) {
    const existing = await this.searchHistoryRepository.findOne({
      where: { keyword: dto.keyword, accountId: dto.accountId }
    });

    if (existing) {
      existing.updatedAt = new Date();
      return this.searchHistoryRepository.save(existing);
    }

    return this.searchHistoryRepository.save(dto);
  }

  async saveSearch(dto: CreateSearchHistoryDto) {
    return this.create(dto);
  }

  async findAllByUser(dto: any, accountId: string) {
    return this.searchHistoryRepository.find({
      where: { accountId },
      order: { updatedAt: 'DESC' },
      take: dto.limit || 10,
      skip: dto.offset || 0
    });
  }

  async getUserSearchHistory(accountId: string, limit = 10) {
    return this.searchHistoryRepository.find({
      where: { accountId },
      order: { updatedAt: 'DESC' },
      take: limit
    });
  }
}