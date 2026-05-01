import { Controller, Get, Query, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminActionLogService } from './admin-action-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { UserRole, PermissionAction } from '../enum';
import { AdminActionLogQueryDto } from './dto/admin-action-log.dto';
import { AdminProtected } from './decorators/admin-protected.decorator';
import { Response } from 'express';
import { sendCsvResponse, generateCsvFileName } from '../utils/csv.utils';

@ApiTags('Admin Action Logs')
@Controller('admin-action-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AdminActionLogController {
  constructor(private readonly logService: AdminActionLogService) {}

  @Get('export-csv')
  @ApiOperation({ summary: 'Export admin action logs as CSV' })
  @UseGuards(PermissionsGuard)
  @CheckPermissions([PermissionAction.READ, 'admin-action-logs'])
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async exportCsv(@Query() query: AdminActionLogQueryDto, @Res() res: Response) {
    const csv = await this.logService.exportCsv(query);
    sendCsvResponse(res, csv, generateCsvFileName('wiznovy-admin-logs-export'));
  }

  @Get()
  @ApiOperation({ summary: 'Get all admin action logs with filters' })
  @UseGuards(PermissionsGuard)
  @CheckPermissions([PermissionAction.READ, 'admin-action-logs'])
  findAll(@Query() query: AdminActionLogQueryDto) {
    return this.logService.findAll(query);
  }

  @Get('process-queue')
  @ApiOperation({ summary: 'Get queue status' })
  @AdminProtected()
  async getQueueStatus() {
    return { message: 'Worker service is processing queue automatically' };
  }
}
