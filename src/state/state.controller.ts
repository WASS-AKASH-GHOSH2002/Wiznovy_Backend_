import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StateService } from './state.service';
import { CreateStateDto, StatePaginationDto, StateStatusDto, UpdateStateDto, BulkStateStatusDto } from './dto/create-state.dto';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionAction, UserRole } from 'src/enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';

@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
   @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'state'])
  create(@Body() createStateDto: CreateStateDto) {
    return this.stateService.create(createStateDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'state'])
  findAll(@Query() dto: StatePaginationDto) {
    return this.stateService.findAll(dto);
  }

  @Get('user')
  findByUser(@Query('countryId') countryId?: string) {
    return this.stateService.findByUser(countryId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'state'])
  findOne(@Param('id') id: string) {
    return this.stateService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'state'])
  update(@Param('id') id: string, @Body() updateStateDto: UpdateStateDto) {
    return this.stateService.update(id, updateStateDto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'state'])
  updateStatus(@Param('id') id: string, @Body() dto: StateStatusDto) {
    return this.stateService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'state'])
  remove(@Param('id') id: string) {
    return this.stateService.remove(id);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'state'])
  bulkUpdateStatus(@Body() dto: BulkStateStatusDto) {
    return this.stateService.bulkUpdateStatus(dto);
  }
}