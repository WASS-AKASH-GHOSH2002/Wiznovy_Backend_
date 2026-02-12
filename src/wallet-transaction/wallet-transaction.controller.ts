import { Controller, Get,Param, Query, UseGuards,  } from '@nestjs/common';
import { WalletTransactionService } from './wallet-transaction.service';
import {  WalletTransactionPaginationDto } from './dto/create-wallet-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { UserRole } from 'src/enum';

@Controller('wallet-transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WalletTransactionController {
  constructor(private readonly walletTransactionService: WalletTransactionService) {}


  @Get()
  @Roles(UserRole.TUTOR, UserRole.USER)
  findAll(@Query() dto: WalletTransactionPaginationDto, @CurrentUser() user: Account) {
    return this.walletTransactionService.findAll(user.id, dto);
  }

  

  @Get('balance')
  @Roles(UserRole.TUTOR, UserRole.USER)
  getBalance(@CurrentUser() user: Account) {
    return this.walletTransactionService.getWalletBalance(user.id);
  }

  @Get('stats')
  @Roles(UserRole.TUTOR, UserRole.USER)
  getStats(@CurrentUser() user: Account) {
    return this.walletTransactionService.getTransactionStats(user.id);
  }

  @Get(':id')
  @Roles(UserRole.TUTOR, UserRole.USER)
  findOne(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.walletTransactionService.findOne(id, user.id);
  }

  @Get('user/history')
  @Roles(UserRole.USER)
  findByUser(@Query() dto: WalletTransactionPaginationDto, @CurrentUser() user: Account) {
    return this.walletTransactionService.findByUser(user.id, dto);
  }

  @Get('tutor/history')
  @Roles(UserRole.TUTOR)
  findByTutor(@Query() dto: WalletTransactionPaginationDto, @CurrentUser() user: Account) {
    return this.walletTransactionService.findByTutor(user.id, dto);
  }

}