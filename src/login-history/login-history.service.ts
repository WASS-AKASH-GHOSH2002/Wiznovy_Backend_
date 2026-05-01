import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, } from 'typeorm';
import { LoginHistory } from './entities/login-history.entity';
import { LoginHistoryFilterDto } from './dto/login-history.dto';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';

@Injectable()
export class LoginHistoryService {
    constructor(
        @InjectRepository(LoginHistory)
        private readonly loginHistoryRepository: Repository<LoginHistory>,
    ) { }

    async recordLogin(accountId: string, ip: string, userAgent?: string) {
        await this.loginHistoryRepository.save({
            accountId,
            ip,
            userAgent: userAgent || null,
            loginTime: new Date(),
        });
    }

    async recordLogout(accountId: string, ip: string) {
        const lastEntry = await this.loginHistoryRepository.findOne({
            where: { accountId, ip, logoutTime: IsNull() },
            order: { loginTime: 'DESC' },
        });
        if (!lastEntry) {
            throw new NotFoundException('No login record found for the account');
        }

        lastEntry.logoutTime = new Date();
        await this.loginHistoryRepository.save(lastEntry);

    }

    async findAll(dto: LoginHistoryFilterDto) {
        const query = this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .leftJoinAndSelect('loginHistory.account', 'account')
            .leftJoinAndSelect('account.userDetail', 'userDetail')
            .select([
                'loginHistory.id',
                'loginHistory.ip',
                'loginHistory.userAgent',
                'loginHistory.loginTime',
                'loginHistory.logoutTime',
                'account.id',
                'account.email',
                'account.roles',
                'userDetail.name',
            ]);

        if (dto.role) {
            query.andWhere('account.roles = :role', { role: dto.role });
        }

        if (dto.keyword) {
            query.andWhere(
                '(userDetail.name LIKE :keyword OR staffDetail.name LIKE :keyword OR account.email LIKE :keyword)',
                { keyword: `%${dto.keyword}%` }
            );
        }

        const [result, total] = await query
            .orderBy('loginHistory.loginTime', 'DESC')
            .skip(dto.offset)
            .take(dto.limit)
            .getManyAndCount();

        return { result, total };
    }

    async findOne(id: string) {
        return this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .leftJoinAndSelect('loginHistory.account', 'account')
            .leftJoinAndSelect('account.userDetail', 'userDetail')
            .leftJoinAndSelect('account.staffDetail', 'staffDetail')
            .select([
                'loginHistory.id',
                'loginHistory.ip',
                'loginHistory.userAgent',
                'loginHistory.loginTime',
                'loginHistory.logoutTime',
                'account.id',
                'account.email',
                'account.roles',
                'userDetail.name',
                'staffDetail.name'
            ])
            .where('loginHistory.id = :id OR account.id = :id', { id })
            .getOne();
    }

    async getLastLogin(accountId: string) {
        return this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .select([
                'loginHistory.id',
                'loginHistory.ip',
                'loginHistory.userAgent',
                'loginHistory.loginTime',
                'loginHistory.logoutTime',
            ])
            .where('loginHistory.accountId = :accountId', { accountId })
            .orderBy('loginHistory.loginTime', 'DESC')
            .skip(1)
            .take(1)
            .getOne();
    }

    async findMyHistory(accountId: string, dto: CommonPaginationDto) {
        const [result, total] = await this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .select([
                'loginHistory.id',
                'loginHistory.ip',
                'loginHistory.userAgent',
                'loginHistory.loginTime',
                'loginHistory.logoutTime',
            ])
            .where('loginHistory.accountId = :accountId', { accountId })
            .orderBy('loginHistory.loginTime', 'DESC')
            .skip(dto.offset)
            .take(dto.limit)
            .getManyAndCount();

        return { result, total };
    }

    async findByAccountId(accountId: string, dto: LoginHistoryFilterDto) {
        const [result, total] = await this.loginHistoryRepository
            .createQueryBuilder('loginHistory')
            .leftJoinAndSelect('loginHistory.account', 'account')
            .leftJoinAndSelect('account.staffDetail', 'staffDetail')
            .leftJoinAndSelect('staffDetail.designation', 'designation')
            .select([
                'loginHistory.id',
                'loginHistory.ip',
                'loginHistory.userAgent',
                'loginHistory.loginTime',
                'loginHistory.logoutTime',
                'account.id',
                'account.email',
                'account.phoneNumber',
                'account.password',
                'account.roles',
                'account.status',
                'staffDetail.id',
                'staffDetail.name',
                'staffDetail.gender',
                'staffDetail.dob',
                'staffDetail.city',
                'staffDetail.state',
                'staffDetail.country',
                'designation.id',
                'designation.name',
            ])
            .where('loginHistory.accountId = :accountId', { accountId })
            .orderBy('loginHistory.loginTime', 'DESC')
            .skip(dto.offset)
            .take(dto.limit)
            .getManyAndCount();

        return { result, total };
    }
}