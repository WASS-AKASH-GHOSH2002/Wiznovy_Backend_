import { Controller, Get, Post, UseGuards, Body, Headers, } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { UserRole } from 'src/enum';
import { AddFundsDto, WithdrawFundsDto,  } from './dto/wallet.dto';
import Stripe from 'stripe';

@Controller('wallet')
export class WalletController {
  private readonly stripe: Stripe;

  constructor(private readonly walletService: WalletService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-10-29.clover',
      });
    }
  }


  @Post('add-funds')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.USER)
  addFunds(@CurrentUser() user: Account, @Body() dto: AddFundsDto) {
    return this.walletService.addFunds(user.id, dto.amount);
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.walletService.processStripeWebhook(body, signature);
  }

  @Post('confirm-transaction/:transactionId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.USER)
  confirmTransaction(@CurrentUser() user: Account, @Body() body: { transactionId: string }) {
    return this.walletService.confirmTransaction(user.id, body.transactionId);
  }

  @Post('withdraw-funds')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR, UserRole.USER)
  withdraw(@CurrentUser()user:Account, dto: WithdrawFundsDto){
    return this.walletService.withdrawFunds(user.id, dto);
  }

 

  @Get('user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles( UserRole.USER)
  findOne(@CurrentUser() user: Account) {
    return this.walletService.getWalletBalance(user.id);
  }
@Get('tutor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles( UserRole.TUTOR)
findOneTutor(@CurrentUser() user: Account) {

  return this.walletService.getTutorWalletBalance(user.id);

}
}
