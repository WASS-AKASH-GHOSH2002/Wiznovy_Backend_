import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/account/entities/account.entity';
import { DefaultStatus, UserRole } from 'src/enum';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Account) private readonly accRepo: Repository<Account>,
  ) {}
}
