import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Account } from 'src/account/entities/account.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { UpdateStaffDetailDto } from './dto/staff-detail.dto';
import { StaffDetailsService } from './staff-details.service';

@Controller('staff-details')
export class StaffDetailsController {
  constructor(private readonly staffDetailsService: StaffDetailsService) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...Object.values(UserRole))
  getProfile(@CurrentUser() user: Account) {
    return this.staffDetailsService.profile(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(...Object.values(UserRole))
  @CheckPermissions([PermissionAction.READ, 'staff_detail'])
  findOne(@Param('id') id: string) {
    return this.staffDetailsService.profile(id);
  }

  @Patch('profile/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(...Object.values(UserRole))
  @CheckPermissions([PermissionAction.READ, 'staff_detail'])
  updateProfileById(
    @Param('id') id: string,
    @CurrentUser() user: Account,
    @Body() dto: UpdateStaffDetailDto,
  ) {
    dto.updatedBy = user.id;
    return this.staffDetailsService.update(id, dto);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...Object.values(UserRole))
  updateProfile(
    @CurrentUser() user: Account,
    @Body() dto: UpdateStaffDetailDto,
  ) {
    dto.updatedBy = user.id;
    return this.staffDetailsService.update(user.id, dto);
  }
}
