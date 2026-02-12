import { Controller, Post, Get, Body, Query, Param, UseGuards, Patch, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto, SessionPaginationDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { AdminCancelSessionDto } from './dto/admin-cancel-session.dto';
import { RescheduleSessionDto } from './dto/reschedule-session.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { UserRole } from '../enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

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

  @Post('confirm-payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Confirm payment and finalize session booking' })
  @ApiResponse({ status: 200, description: 'Payment confirmed and session booked' })
  @ApiResponse({ status: 400, description: 'Session not found or invalid status' })
  @ApiResponse({ status: 409, description: 'Session lock expired' })
  confirmPayment(@Body() dto: ConfirmPaymentDto, @CurrentUser() user: Account) {
    return this.sessionService.confirmPayment(dto.sessionId, user.id, dto);
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

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER, UserRole.TUTOR)
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session found' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findSessionById(@Param('id') id: string, @CurrentUser() user: Account) {
    return this.sessionService.findSessionById(id, user.id);
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

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admin: View all sessions with filters' })
  findAllSessions(@Query() dto: SessionPaginationDto) {
    return this.sessionService.findAllSessions(dto);
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admin: Get session details by ID' })
  adminFindOne(@Param('id') id: string) {
    return this.sessionService.adminFindOne(id);
  }

  @Patch('admin/reschedule/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admin: Reschedule any session' })
  adminRescheduleSession(@Param('id') id: string, @Body() dto: RescheduleSessionDto) {
    return this.sessionService.adminRescheduleSession(id, dto);
  }

  @Patch('admin/cancel/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admin: Cancel any session' })
  adminCancelSession(@Param('id') id: string, @Body() dto: AdminCancelSessionDto, @CurrentUser() admin: Account, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sessionService.adminCancelSession(id, dto, admin.id, ipAddress, userAgent);
  }

  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Admin: Manually create session for testing' })
  adminCreateSession(@Body() dto: CreateSessionDto) {
    return this.sessionService.adminCreateSession(dto);
  }
}