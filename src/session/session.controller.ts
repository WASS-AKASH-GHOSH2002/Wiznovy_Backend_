import { Controller, Post, Get, Body, Query, Param, UseGuards, Patch, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto, SessionPaginationDto, BookRegularSessionDto, BookTrialSessionDto } from './dto/create-session.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { AdminCancelSessionDto } from './dto/admin-cancel-session.dto';
import { RescheduleSessionDto } from './dto/reschedule-session.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { PermissionAction, UserRole, } from '../enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckPermissions } from '../auth/decorators/permissions.decorator';
import { AdminProtected } from '../admin-action-log/decorators/admin-protected.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SabbathGuard } from '../sabbath/sabbath.guard';
import { ExportStudentsCsvDto } from '../account/dto/export-students-csv.dto';
import { sendCsvResponse } from 'src/utils/csv.utils';

@ApiTags('Sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  

  @Post('book/regular')
  @UseGuards(RolesGuard, SabbathGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Book a regular session with a tutor' })
  @ApiResponse({ status: 201, description: 'Regular session booked successfully' })
  bookRegularSession(@Body() dto: BookRegularSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.bookRegularSession(dto, user.id);
  }

  @Post('book/trial')
  @UseGuards(RolesGuard, SabbathGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Book a trial session with a tutor (25 minutes, free)' })
  @ApiResponse({ status: 201, description: 'Trial session booked successfully' })
  @ApiResponse({ status: 409, description: 'Trial session already booked with this tutor' })
  bookTrialSession(@Body() dto: BookTrialSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.bookTrialSession(dto, user.id);
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

  @Patch('user/reschedule/:id')
  @ApiOperation({ summary: 'User: Reschedule a session (fee may apply based on timing)' })
  @ApiResponse({ status: 200, description: 'Session rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Blocked - too close, max reschedules reached, or insufficient wallet balance' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  userRescheduleSession(@Param('id') id: string, @Body() dto: RescheduleSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.userRescheduleSession(id, user.id, dto);
  }

  @Patch('tutor/reschedule/:id')
  @ApiOperation({ summary: 'Tutor: Reschedule a session' })
  @ApiResponse({ status: 200, description: 'Session rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Reschedule not allowed - insufficient notice or max limit reached' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  tutorRescheduleSession(@Param('id') id: string, @Body() dto: RescheduleSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.tutorRescheduleSession(id, user.id, dto);
  }

  @Patch('tutor/cancel/:id')
  @ApiOperation({ summary: 'Tutor: Cancel a session by session ID' })
  @ApiResponse({ status: 200, description: 'Session cancelled and full refund credited to user wallet' })
  @ApiResponse({ status: 400, description: 'Cancellation not allowed - insufficient notice' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  tutorCancelSession(@Param('id') id: string, @Body() dto: CancelSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.tutorCancelSession(id, user.id, dto.reason);
  }

  @Patch('user/cancel/:id')
  @ApiOperation({ summary: 'User: Cancel a booked session by session ID' })
  @ApiResponse({ status: 200, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Session cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  cancelSessionById(@Param('id') id:string, @Body() dto:CancelSessionDto, @CurrentUser() user: Account) {
    dto.sessionId = id;
    return this.sessionService.cancelSession(dto, user.id);
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



  // @Patch('reschedule')
  // @ApiOperation({ summary: 'Reschedule a booked session' })
  // @ApiResponse({ status: 200, description: 'Session rescheduled successfully' })
  // @ApiResponse({ status: 400, description: 'Session cannot be rescheduled (too late or invalid status)' })
  // @ApiResponse({ status: 404, description: 'Session not found' })
  // @ApiResponse({ status: 409, description: 'Selected time slot is already booked' })
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.USER)
  // rescheduleSession(@Body() dto: RescheduleSessionDto, @CurrentUser() user: Account) {
  //   return this.sessionService.rescheduleSession(dto, user.id);
  // }

 
 



  @Post('send-reminders')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'session'])
  @ApiOperation({ summary: 'Send reminder emails for upcoming sessions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reminders sent successfully' })
  sendSessionReminders() {
    return this.sessionService.sendSessionReminders();
  }

  @Get('account/:accountId')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'session'])
  @ApiOperation({ summary: 'Get all sessions by account ID' })
  @ApiResponse({ status: 200, description: 'Returns all sessions for the account' })
  findSessionsByAccountId(@Param('accountId') accountId: string, @Query() dto: SessionPaginationDto) {
    return this.sessionService.findSessionsByAccountId(accountId, dto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'session'])
  @ApiOperation({ summary: 'Admin: View all sessions with filters' })
  findAllSessions(@Query() dto: SessionPaginationDto) {
    return this.sessionService.findAllSessions(dto);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'session'])
  @ApiOperation({ summary: 'Admin: Get session details by ID' })
  adminFindOne(@Param('id') id: string) {
    return this.sessionService.adminFindOne(id);
  }

  @Patch('admin/reschedule/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'session'])
  @ApiOperation({ summary: 'Admin: Reschedule any session' })
  adminRescheduleSession(@Param('id') id: string, @Body() dto: RescheduleSessionDto) {
    return this.sessionService.adminRescheduleSession(id, dto);
  }

  @Patch('admin/cancel/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'session'])
  @ApiOperation({ summary: 'Admin: Cancel any session' })
  adminCancelSession(@Param('id') id: string, @Body() dto: AdminCancelSessionDto, @CurrentUser() admin: Account, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.sessionService.adminCancelSession(id, dto, admin.id, ipAddress, userAgent);
  }

  @Post('admin/create')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.CREATE, 'session'])
  @ApiOperation({ summary: 'Admin: Manually create session for testing' })
  adminCreateSession(@Body() dto: CreateSessionDto) {
    return this.sessionService.adminCreateSession(dto);
  }

  @Get('admin/export/csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @AdminProtected()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'session'])
  @ApiOperation({ summary: 'Admin: Export sessions to CSV with date range filter' })
  async exportSessionsCsv(@Query() dto: ExportStudentsCsvDto, @Res() res: Response) {
    const { csv, fileName } = await this.sessionService.exportSessionsCsv(dto);
    sendCsvResponse(res, csv, fileName);
  }
}
