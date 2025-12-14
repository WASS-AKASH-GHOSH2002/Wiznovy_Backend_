import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/enum';
import { Account } from 'src/account/entities/account.entity';
import { WalletService } from './wallet.service';
import { AddFundsDto, WithdrawFundsDto, TransactionHistoryDto } from './dto/wallet.dto';

@ApiTags('wallet')
@ApiBearerAuth('JWT-auth')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Returns wallet balance and summary' })
  getBalance(@CurrentUser() user: Account) {
    return this.walletService.getWalletBalance(user.id);
  }

  @Post('add-funds')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Add funds to tutor wallet' })
  @ApiBody({ type: AddFundsDto })
  @ApiResponse({ status: 201, description: 'Funds added successfully' })
  addFunds(@Body() dto: AddFundsDto, @CurrentUser() user: Account) {
    return this.walletService.addFunds(user.id, dto);
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  @ApiBody({ type: WithdrawFundsDto })
  @ApiResponse({ status: 201, description: 'Funds withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  withdrawFunds(@Body() dto: WithdrawFundsDto, @CurrentUser() user: Account) {
    return this.walletService.withdrawFunds(user.id, dto);
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, description: 'Returns transaction history' })
  getTransactions(@Query() dto: TransactionHistoryDto, @CurrentUser() user: Account) {
    return this.walletService.getTransactionHistory(user.id, dto);
  }
}
