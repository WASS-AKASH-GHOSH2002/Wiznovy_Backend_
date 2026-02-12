import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { ContactUsCategoryService } from './contact-us-category.service';
import { CreateContactUsCategoryDto, ContactUsCategoryPaginationDto, ContactUsCategoryStatusDto, BulkContactUsCategoryStatusDto } from './dto/create-contact-us-category.dto';
import { UpdateContactUsCategoryDto } from './dto/update-contact-us-category.dto';
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

@ApiTags('contact-us-category')
@ApiBearerAuth('JWT-auth')
@Controller('contact-us-category')
export class ContactUsCategoryController {
  constructor(private readonly contactUsCategoryService: ContactUsCategoryService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'contact-us-category'])
  @ApiOperation({ summary: 'Create new contact us category' })
  @ApiBody({ type: CreateContactUsCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: CreateContactUsCategoryDto) {
    return this.contactUsCategoryService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'contact-us-category'])
  @ApiOperation({ summary: 'Get paginated category list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated category list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: ContactUsCategoryPaginationDto) {
    return this.contactUsCategoryService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all categories for users' })
  @ApiResponse({ status: 200, description: 'Returns all active categories' })
  findByUser() {
    return this.contactUsCategoryService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'contact-us-category'])
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.contactUsCategoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'contact-us-category'])
  @ApiOperation({ summary: 'Update category details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateContactUsCategoryDto })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateContactUsCategoryDto) {
    return this.contactUsCategoryService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'contact-us-category'])
  @ApiOperation({ summary: 'Update category status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: ContactUsCategoryStatusDto })
  @ApiResponse({ status: 200, description: 'Category status updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: ContactUsCategoryStatusDto) {
    return this.contactUsCategoryService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'contact-us-category'])
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.contactUsCategoryService.remove(id);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'contact-us-category'])
  @ApiOperation({ summary: 'Bulk update category status' })
  @ApiBody({ type: BulkContactUsCategoryStatusDto })
  @ApiResponse({ status: 200, description: 'Categories status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  bulkUpdateStatus(@Body() dto: BulkContactUsCategoryStatusDto) {
    return this.contactUsCategoryService.bulkUpdateStatus(dto);
  }
}
