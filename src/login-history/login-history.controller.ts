import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { LoginHistoryFilterDto } from './dto/login-history.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionAction, UserRole } from 'src/enum';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';

@Controller('login-history')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) { }

  @Get()
   @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
    @AdminProtected()
    @Roles(UserRole.ADMIN, UserRole.STAFF,)
     @CheckPermissions([PermissionAction.READ, 'login-history'])
  findAll(@Query() dto: LoginHistoryFilterDto) {
    return this.loginHistoryService.findAll(dto);
  }

  @Get('my-history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER, UserRole.TUTOR)
  findMyHistory(@CurrentUser() user: Account, @Query() dto: CommonPaginationDto) {
    return this.loginHistoryService.findMyHistory(user.id, dto);
  }

  @Get('account/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'login-history'])
  findByAccountId(@Param('accountId') accountId: string, @Query() dto: LoginHistoryFilterDto) {
    return this.loginHistoryService.findByAccountId(accountId, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.loginHistoryService.findOne(id);
  }
}