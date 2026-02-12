import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { GoalService } from './goal.service';
import { CreateGoalDto, GoalPaginationDto, GoalStatusDto, BulkGoalStatusDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
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

@ApiTags('goal')
@ApiBearerAuth('JWT-auth')
@Controller('goal')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'goal'])
  @ApiOperation({ summary: 'Create new goal' })
  @ApiBody({ type: CreateGoalDto })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: CreateGoalDto) {
    return this.goalService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'goal'])
  @ApiOperation({ summary: 'Get paginated goal list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated goal list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: GoalPaginationDto) {
    return this.goalService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all goals for users' })
  @ApiResponse({ status: 200, description: 'Returns all active goals' })
  findByUser() {
    return this.goalService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'topic'])
  @ApiOperation({ summary: 'Get goal by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns goal details' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.goalService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'topic'])
  @ApiOperation({ summary: 'Update goal details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateGoalDto })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'topic'])
  @ApiOperation({ summary: 'Update goal status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: GoalStatusDto })
  @ApiResponse({ status: 200, description: 'Goal status updated successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: GoalStatusDto) {
    return this.goalService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'topic'])
  @ApiOperation({ summary: 'Delete goal' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.goalService.remove(id);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'goal'])
  @ApiOperation({ summary: 'Bulk update goal status' })
  @ApiBody({ type: BulkGoalStatusDto })
  @ApiResponse({ status: 200, description: 'Goals status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  bulkUpdateStatus(@Body() dto: BulkGoalStatusDto) {
    return this.goalService.bulkUpdateStatus(dto);
  }
}