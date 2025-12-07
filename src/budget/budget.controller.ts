import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto, BudgetPaginationDto, BudgetStatusDto, UpdateBudgetDto } from './dto/create-budget.dto';
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

@ApiTags('budget')
@ApiBearerAuth('JWT-auth')
@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'budget'])
  @ApiOperation({ summary: 'Create new budget' })
  @ApiBody({ type: CreateBudgetDto })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'budget'])
  @ApiOperation({ summary: 'Get paginated budget list' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', enum: DefaultStatus, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated budget list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(@Query() dto: BudgetPaginationDto) {
    return this.budgetService.findAll(dto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all budgets for users' })
  @ApiResponse({ status: 200, description: 'Returns all active budgets' })
  findByUser() {
    return this.budgetService.findByUser();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'budget'])
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Returns budget details' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'budget'])
  @ApiOperation({ summary: 'Update budget details' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: UpdateBudgetDto })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'budget'])
  @ApiOperation({ summary: 'Update budget status' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiBody({ type: BudgetStatusDto })
  @ApiResponse({ status: 200, description: 'Budget status updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateStatus(@Param('id') id: string, @Body() dto: BudgetStatusDto) {
    return this.budgetService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'budget'])
  @ApiOperation({ summary: 'Delete budget' })
  @ApiParam({ name: 'id', type: String, example: '1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }
}