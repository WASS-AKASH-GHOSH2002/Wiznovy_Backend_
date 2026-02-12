import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import { CreateQualificationDto, QualificationPaginationDto, QualificationStatusDto, BulkQualificationStatusDto } from './dto/create-qualification.dto';
import { UpdateQualificationDto } from './dto/update-qualification.dto';
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

@ApiTags('qualification')
@ApiBearerAuth('JWT-auth')
@Controller('qualification')
export class QualificationController {
  constructor(private readonly qualificationService: QualificationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'qualification'])
  @ApiOperation({ summary: 'Create new qualification' })
  @ApiBody({ type: CreateQualificationDto })
  @ApiResponse({ status: 201, description: 'Qualification created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: CreateQualificationDto) {
    return this.qualificationService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'qualification'])
  @ApiOperation({ summary: 'Get paginated qualification list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated qualification list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: QualificationPaginationDto) {
    return this.qualificationService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all qualifications for users' })
  @ApiResponse({ status: 200, description: 'Returns all active qualifications' })
  findByUser() {
    return this.qualificationService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'qualification'])
  @ApiOperation({ summary: 'Get qualification by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns qualification details' })
  @ApiResponse({ status: 404, description: 'Qualification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.qualificationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'qualification'])
  @ApiOperation({ summary: 'Update qualification details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateQualificationDto })
  @ApiResponse({ status: 200, description: 'Qualification updated successfully' })
  @ApiResponse({ status: 404, description: 'Qualification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateQualificationDto) {
    return this.qualificationService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'qualification'])
  @ApiOperation({ summary: 'Update qualification status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: QualificationStatusDto })
  @ApiResponse({ status: 200, description: 'Qualification status updated successfully' })
  @ApiResponse({ status: 404, description: 'Qualification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: QualificationStatusDto) {
    return this.qualificationService.updateStatus(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'qualification'])
  @ApiOperation({ summary: 'Bulk update qualification status' })
  @ApiBody({ type: BulkQualificationStatusDto })
  @ApiResponse({ status: 200, description: 'Qualifications status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  bulkUpdateStatus(@Body() dto: BulkQualificationStatusDto) {
    return this.qualificationService.bulkUpdateStatus(dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'qualification'])
  @ApiOperation({ summary: 'Delete qualification' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Qualification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Qualification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.qualificationService.remove(id);
  }
}
