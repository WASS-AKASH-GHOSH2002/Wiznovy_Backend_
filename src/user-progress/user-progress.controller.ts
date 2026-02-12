import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { UserProgressService } from './user-progress.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { PermissionAction, UserRole } from '../enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { MarkProgressDto, UserProgressPaginationDto } from './dto/mark-progress.dto';


@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) { }

  @Post('update')
  @UseGuards(AuthGuard('jwt'))
  async updateProgress(@Body() dto: MarkProgressDto, @CurrentUser() user: Account) {
    dto.userId = user.id;
    return this.userProgressService.updateProgress(dto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'student-reports'])
  async findAll(@Query() dto: UserProgressPaginationDto) {
    return this.userProgressService.findAll(dto);
  }

  @Get('my-progress')
  @UseGuards(AuthGuard('jwt'))
  async getMyProgress(
    @CurrentUser() user: Account,
    @Query() dto: UserProgressPaginationDto
  ) {
    return this.userProgressService.findAllByUser(user.id, dto);
  }

}