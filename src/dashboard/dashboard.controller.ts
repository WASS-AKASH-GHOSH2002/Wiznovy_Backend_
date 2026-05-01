import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('counts')
  @UseGuards(AuthGuard('jwt'), RolesGuard, )
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'dashboard'])
  @ApiOperation({ summary: 'Get dashboard counts for users, staff, tutors, courses and books' })
  @ApiResponse({ status: 200, description: 'Returns all dashboard counts' })
  getCounts() {
    return this.dashboardService.getCounts();
  }
}
