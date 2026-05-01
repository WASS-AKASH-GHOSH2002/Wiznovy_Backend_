import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto, DesignationPaginationDto, DesignationStatusDto, BulkDesignationStatusDto, UpdateDesignationDto } from './dto/create-designation.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
import { DefaultStatus, PermissionAction, UserRole } from 'src/enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';

@ApiTags('designations')
@ApiBearerAuth('JWT-auth')
@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'designations'])
  @ApiOperation({ summary: 'Create new designation' })
  @ApiBody({ type: CreateDesignationDto })
  @ApiResponse({ status: 201, description: 'Designation created successfully' })
  @ApiResponse({ status: 409, description: 'Designation already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateDesignationDto) {
    return this.designationsService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'designations'])
  @ApiOperation({ summary: 'Get paginated designation list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated designation list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() dto: DesignationPaginationDto) {
    return this.designationsService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all active designations for users' })
  @ApiResponse({ status: 200, description: 'Returns all active designations' })
  findByUser() {
    return this.designationsService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'designations'])
  @ApiOperation({ summary: 'Get designation by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns designation details' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'designations'])
  @ApiOperation({ summary: 'Update designation' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateDesignationDto })
  @ApiResponse({ status: 200, description: 'Designation updated successfully' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.designationsService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'designations'])
  @ApiOperation({ summary: 'Update designation status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DesignationStatusDto })
  @ApiResponse({ status: 200, description: 'Designation status updated successfully' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  updateStatus(@Param('id') id: string, @Body() dto: DesignationStatusDto) {
    return this.designationsService.updateStatus(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'designations'])
  @ApiOperation({ summary: 'Bulk update designation status' })
  @ApiBody({ type: BulkDesignationStatusDto })
  @ApiResponse({ status: 200, description: 'Designations status updated successfully' })
  bulkUpdateStatus(@Body() dto: BulkDesignationStatusDto) {
    return this.designationsService.bulkUpdateStatus(dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'designations'])
  @ApiOperation({ summary: 'Delete designation' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Designation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
