import { Controller, Get, UseGuards, Query, Post } from '@nestjs/common';
import { UserPurchaseService } from './user-purchase.service';
import { UserPurchasePaginationDto } from './dto/create-user-purchase.dto';
import { UserPurchaseQueryDto } from './dto/user-purchase-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';

@Controller('purchase')
export class UserPurchaseController {
  constructor(private readonly userPurchaseService: UserPurchaseService) { }

  @Get('admin/history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllPurchases(@Query() dto: UserPurchasePaginationDto) {
    return this.userPurchaseService.findAll(dto);
  }

  @Get('my-history')
  @UseGuards(AuthGuard('jwt'))
  getMyPurchases(
    @CurrentUser() user: Account, 
    @Query() query: UserPurchaseQueryDto
  ) {
    return this.userPurchaseService.findAllByUser(user.id, query);
  }

  @Post('admin/check-expiry')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkExpiry() {
    await this.userPurchaseService.checkExpiringSoon();
    await this.userPurchaseService.checkExpired();
    return { message: 'Expiry notifications sent successfully' };
  }
}