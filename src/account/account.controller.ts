import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DefaultStatus, PermissionAction, UserRole } from 'src/enum';
import { MenusService } from 'src/menus/menus.service';
import { PermissionsService } from 'src/permissions/permissions.service';
import { UserPermissionsService } from 'src/user-permissions/user-permissions.service';
import { AccountService } from './account.service';
import {
  CreateAccountDto,
  SearchUserPaginationDto,
  UpdateStaffDto,
  UpdateStaffPasswordDto,
} from './dto/account.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status.dto';
import { UpdateUserContactDto } from './dto/update-user-contact.dto';
import { Account } from './entities/account.entity';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { DefaultStatusPaginationDto } from 'src/common/dto/default-status-pagination.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('account')
@ApiBearerAuth('JWT-auth')
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly menuService: MenusService,
    private readonly permissionService: PermissionsService,
    private readonly userPermService: UserPermissionsService,
  ) { }

  @Get('perms/:accountId')
  @ApiOperation({ summary: 'Create permissions for account' })
  @ApiParam({ name: 'accountId', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Permissions created successfully' })
  async createPerms(@Param('accountId') accountId: string) {
    const menus = await this.menuService.findAll();
    const perms = await this.permissionService.findAll();

    const obj = [];
    for (const menu of menus) {
      for (const perm of perms) {
        obj.push({
          accountId: accountId,
          menuId: menu.id,
          permissionId: perm.id,
          status: true,
        });
      }
    }
    this.userPermService.create(obj);
    return 'Done';
  }

  @Post('add-staff')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.CREATE, 'account'])
  @ApiOperation({ summary: 'Add new staff member' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ status: 201, description: 'Staff created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() dto: CreateAccountDto, @CurrentUser() user: Account) {
    const account = await this.accountService.create(dto, user.id);
    const menus = await this.menuService.findAll();
    const perms = await this.permissionService.findAll();
    const obj = [];
    for (const menu of menus) {
      for (const perm of perms) {
        obj.push({
          accountId: account.id,
          menuId: menu.id,
          permissionId: perm.id,
        });
      }
    }
    await this.userPermService.create(obj);
    return account;
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  userProfile(@CurrentUser() user: Account) {
    return this.accountService.userProfile(user.id);
  }

  @Get('tutor/profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get tutor profile' })
  @ApiResponse({ status: 200, description: 'Returns tutor profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Tutor profile not found' })
  tutorProfile(@CurrentUser() user: Account) {
    return this.accountService.tutorProfile(user.id);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated users list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getAllUsers(@Query() dto: SearchUserPaginationDto) {
    return this.accountService.getAllUsers(dto);
  }

  @Get('tutors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Get all tutors with pagination' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiQuery({ name: 'subjectId', type: String, required: false })
  @ApiQuery({ name: 'countryId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated tutors list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getAllTutors(@Query() dto: SearchUserPaginationDto) {
    return this.accountService.getAllTutors(dto);
  }

  @Get('stafflist')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Get staff details with pagination' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated staff list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getStaffDetails(@Query() dto: DefaultStatusPaginationDto) {
    return this.accountService.getStaffDetails(dto);
  }

  @Get('staff/profile/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Get staff profile by account ID' })
  @ApiParam({ name: 'accountId', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns staff profile' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStaffProfile(@Param('accountId') accountId: string) {
    return this.accountService.getStaffProfile(accountId);
  }

  @Patch('update/staff/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update staff details' })
  @ApiParam({ name: 'accountId', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateStaffDto })
  @ApiResponse({ status: 200, description: 'Staff updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStaff(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.accountService.updateStaff(accountId, dto);
  }

  @Patch('staff/password/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update staff password' })
  @ApiParam({ name: 'accountId', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateStaffPasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStaffPassword(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateStaffPasswordDto,
  ) {
    return this.accountService.updateStaffPassword(accountId, dto);
  }

  @Put('staff/status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update staff status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: DefaultStatusDto })
  @ApiResponse({ status: 200, description: 'Staff status updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  staffStatus(@Param('id') id: string, @Body() dto: DefaultStatusDto) {
    return this.accountService.staffStatus(id, dto);
  }

  @Put('user/status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: DefaultStatusDto })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  userStatus(@Param('id') id: string, @Body() dto: DefaultStatusDto) {
    return this.accountService.userStatus(id, dto);
  }

  @Put('tutor/status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update tutor status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: DefaultStatusDto })
  @ApiResponse({ status: 200, description: 'Tutor status updated successfully' })
  @ApiResponse({ status: 404, description: 'Tutor not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  tutorStatus(@Param('id') id: string, @Body() dto: DefaultStatusDto) {
    return this.accountService.tutorStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'account'])
  @ApiOperation({ summary: 'Delete user account' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteUser(@Param('id') id: string) {
    return this.accountService.deleteUser(id);
  }

  @Put('users/bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Bulk update user status' })
  @ApiBody({ type: BulkStatusUpdateDto })
  @ApiResponse({ status: 200, description: 'Users status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  bulkUserStatus(@Body() dto: BulkStatusUpdateDto) {
    return this.accountService.bulkUserStatus(dto.ids, dto.status);
  }

  @Put('tutors/bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Bulk update tutor status' })
  @ApiBody({ type: BulkStatusUpdateDto })
  @ApiResponse({ status: 200, description: 'Tutors status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  bulkTutorStatus(@Body() dto: BulkStatusUpdateDto) {
    return this.accountService.bulkTutorStatus(dto.ids, dto.status);
  }

  @Get('pdf/all-tutors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Generate PDF report for all tutors' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async generateAllTutorsPdf(@Res() res: Response) {
    return this.accountService.generateAllTutorsPdf(res);
  }

  @Get('pdf/all-users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.READ, 'account'])
  @ApiOperation({ summary: 'Generate PDF report for all users' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async generateAllUsersPdf(@Res() res: Response) {
    return this.accountService.generateAllUsersPdf(res);
  }

  @Patch('update-contact/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @CheckPermissions([PermissionAction.UPDATE, 'account'])
  @ApiOperation({ summary: 'Update user email and phone number' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateUserContactDto })
  @ApiResponse({ status: 200, description: 'User contact updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateUserContact(
    @Param('id') id: string,
    @Body() dto: UpdateUserContactDto
  ) {
    return this.accountService.updateUserContact(id, dto);
  }
}