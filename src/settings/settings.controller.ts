import { Controller, Get, Put, Body, UseGuards, Param, ParseUUIDPipe, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionAction, UserRole, FileSizeLimit } from 'src/enum';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateSessionSettingsDto } from './dto/update-session-settings.dto';
import { UpdateCancellationSettingsDto } from './dto/update-cancellation-settings.dto';
import { UpdateRescheduleSettingsDto } from './dto/update-reschedule-settings.dto';
import { AdminProtected } from 'src/admin-action-log/decorators/admin-protected.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileUploadUtil } from 'src/utils/file-upload.util';

@ApiTags('settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  findPublicSettings() {
    return this.settingsService.findPublicSettings();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'settings'])
  findSettings() {
    return this.settingsService.findSettings();
  }

  @Put(':id/logo')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'settings'])
  @ApiOperation({ summary: 'Upload settings logo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', FileUploadUtil.createUploadConfig('./uploads/settings', FileSizeLimit.LOGO_SIZE)))
  uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Logo file is required');
    return this.settingsService.uploadLogo(id, file);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'settings'])
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSettingsDto
  ) {
    return this.settingsService.updateSettings(id, dto);
  }

  // ─── Session Settings ───────────────────────────────────────────────

  @Get('session')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get session settings' })
  getSessionSettings() {
    return this.settingsService.getSessionSettings();
  }

  @Put('session/update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update session settings' })
  updateSessionSettings(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionSettingsDto) {
    return this.settingsService.updateSessionSettings(id, dto);
  }

  // ─── Cancellation Settings ──────────────────────────────────────────

  @Get('cancellation')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get cancellation settings' })
  getCancellationSettings() {
    return this.settingsService.getCancellationSettings();
  }

  @Put('cancellation/update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update cancellation settings' })
  updateCancellationSettings(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCancellationSettingsDto) {
    return this.settingsService.updateCancellationSettings(id, dto);
  }

  // ─── Reschedule Settings ────────────────────────────────────────────

  @Get('reschedule')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get reschedule settings' })
  getRescheduleSettings() {
    return this.settingsService.getRescheduleSettings();
  }

  @Put('reschedule/update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update reschedule settings' })
  updateRescheduleSettings(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRescheduleSettingsDto) {
    return this.settingsService.updateRescheduleSettings(id, dto);
  }
}