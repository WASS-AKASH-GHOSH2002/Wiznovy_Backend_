import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { LanguageDto, UpdateLanguageDto, LanguageStatusDto, PaginationDto, BulkLanguageStatusDto } from './dto/language.dto';
import { LanguagesService } from './languages.service';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('languages')
@ApiBearerAuth('JWT-auth')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'language'])
  @ApiOperation({ summary: 'Create new language' })
  @ApiBody({ type: LanguageDto })
  @ApiResponse({ status: 201, description: 'Language created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: LanguageDto) {
    return this.languagesService.create(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all languages with pagination' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated languages list' })
  find(@Query() dto: PaginationDto) {
    return this.languagesService.findAll(dto);
  }
  
  @Get('list')
  @ApiOperation({ summary: 'Get all active languages for users' })
  @ApiResponse({ status: 200, description: 'Returns all active languages' })
  findByUser() {
    return this.languagesService.findByUser();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns language details' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  findOne(@Param('id') id: string) {
    return this.languagesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'language'])
  @ApiOperation({ summary: 'Update language details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateLanguageDto })
  @ApiResponse({ status: 200, description: 'Language updated successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.languagesService.update(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'language'])
  @ApiOperation({ summary: 'Bulk update language status' })
  @ApiBody({ type: BulkLanguageStatusDto })
  @ApiResponse({ status: 200, description: 'Languages status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  bulkUpdateStatus(@Body() dto: BulkLanguageStatusDto) {
    console.log('Controller - Bulk update request received:', dto);
    return this.languagesService.bulkUpdateStatus(dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'language'])
  @ApiOperation({ summary: 'Update language status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: LanguageStatusDto })
  @ApiResponse({ status: 200, description: 'Language status updated successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: LanguageStatusDto) {
    return this.languagesService.updateStatus(id, dto);
  }

  @Delete('delete/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'language'])
  @ApiOperation({ summary: 'Delete language' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Language deleted successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.languagesService.remove(id);
  }
}