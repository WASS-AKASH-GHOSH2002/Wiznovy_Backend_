import { Controller, Get, Post, Body, Patch, Param, Put, Query, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionAction, UserRole } from 'src/enum';
import { DefaultStatusDto } from 'src/common/dto/default-status.dto';
import { DisposableEmailService } from './disposable-email.service';
import { CreateDisposableEmailDomainDto, UpdateDisposableEmailDomainDto, DisposableEmailPaginationDto, BulkDisposableEmailStatusDto } from './dto/disposable-email-domain.dto';

@Controller('disposable-email')
export class DisposableEmailController {
  constructor(private readonly service: DisposableEmailService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'disposable_email'])
  create(@Body() dto: CreateDisposableEmailDomainDto) {
    return this.service.create(dto);
  }

  @Get('list')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'disposable_email'])
  findAll(@Query() dto: DisposableEmailPaginationDto) {
    return this.service.findAll(dto);
  }

  @Get('check/:email')
  async checkEmail(@Param('email') email: string) {
    const isDisposable = await this.service.isDisposableEmail(email);
    return { email, isDisposable };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'disposable_email'])
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'disposable_email'])
  update(@Param('id') id: string, @Body() dto: UpdateDisposableEmailDomainDto) {
    return this.service.update(id, dto);
  }

  @Put('status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'disposable_email'])
  updateStatus(@Param('id') id: string, @Body() dto: DefaultStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Put('bulk-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'disposable_email'])
  bulkUpdateStatus(@Body() dto: BulkDisposableEmailStatusDto) {
    return this.service.bulkUpdateStatus(dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'disposable_email'])
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}