import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminActionLogService } from './admin-action-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../enum';
import { AdminActionLogQueryDto } from './dto/admin-action-log.dto';
import { AdminProtected } from './decorators/admin-protected.decorator';

@ApiTags('Admin Action Logs')
@Controller('admin-action-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AdminActionLogController {
  constructor(private readonly logService: AdminActionLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all admin action logs with filters' })
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
