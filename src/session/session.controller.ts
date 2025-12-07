import { Controller, Post, Get, Body, Query, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto, SessionPaginationDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { RescheduleSessionDto } from './dto/reschedule-session.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { UserRole } from '../enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('book')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  bookSession(@Body() dto: CreateSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.create(dto, user.id);
  }

  @Get('my-sessions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  findMySessions(@Query() dto: SessionPaginationDto, @CurrentUser() user: Account) {
    return this.sessionService.findUserSessions(user.id, dto);
  }

  @Get('tutor-sessions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  findTutorSessions(@Query() dto: SessionPaginationDto, @CurrentUser() user: Account) {
    return this.sessionService.findTutorSessions(user.id, dto);
  }

  

  @Get('payment-history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getPaymentHistory(@Query() dto: any, @CurrentUser() user: Account) {
    return this.sessionService.getPaymentHistory(user.id, dto);
  }

  @Patch('cancel')
  @ApiOperation({ summary: 'Cancel a booked session' })
  @ApiResponse({ status: 200, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Session cannot be cancelled (too late or invalid status)' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER,UserRole.TUTOR) 
  cancelSession(@Body() dto: CancelSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.cancelSession(dto, user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get all upcoming scheduled sessions for the user' })
  @ApiResponse({ status: 200, description: 'List of upcoming sessions' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getUpcomingSessions(@CurrentUser() user: Account) {
    return this.sessionService.getUpcomingSessions(user.id);
  }



  @Get('cancellation-policy/:sessionId')
  @ApiOperation({ summary: 'Get cancellation policy and eligibility for a specific session' })
  @ApiResponse({ status: 200, description: 'Cancellation policy details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getCancellationPolicy(@Param('sessionId') sessionId: string, @CurrentUser() user: Account) {
    return this.sessionService.getCancellationPolicy(sessionId, user.id);
  }

  @Patch('reschedule')
  @ApiOperation({ summary: 'Reschedule a booked session' })
  @ApiResponse({ status: 200, description: 'Session rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Session cannot be rescheduled (too late or invalid status)' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Selected time slot is already booked' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  rescheduleSession(@Body() dto: RescheduleSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.rescheduleSession(dto, user.id);
  }

  @Get('reschedule-policy/:sessionId')
  @ApiOperation({ summary: 'Get reschedule policy and eligibility for a specific session' })
  @ApiResponse({ status: 200, description: 'Reschedule policy details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getReschedulePolicy(@Param('sessionId') sessionId: string, @CurrentUser() user: Account) {
    return this.sessionService.getReschedulePolicy(sessionId, user.id);
  }

 

  @Post('reschedule-summary')
  @ApiOperation({ summary: 'Get reschedule summary before confirmation' })
  @ApiResponse({ status: 200, description: 'Reschedule summary details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 409, description: 'Selected time slot is already booked' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getRescheduleSummary(@Body() dto: RescheduleSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.getRescheduleSummary(dto, user.id);
  }

  @Post('send-reminders')
  @ApiOperation({ summary: 'Send reminder emails for upcoming sessions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reminders sent successfully' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  sendSessionReminders() {
    return this.sessionService.sendSessionReminders();
  }
}