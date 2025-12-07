import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { FixedSessionService } from './fixed-session.service';
import { CreateFixedSessionDto, FixedSessionPaginationDto } from './dto/create-fixed-session.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Account } from '../account/entities/account.entity';
import { UserRole } from '../enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('fixed-sessions')
@UseGuards(JwtAuthGuard)
export class FixedSessionController {
  constructor(private readonly sessionService: FixedSessionService) {}

  @Post('book')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  createBooking(@Body() dto: CreateFixedSessionDto, @CurrentUser() user: Account) {
    return this.sessionService.createBooking(dto, user.id);
  }

  @Get('booking-details/:sessionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getBookingDetails(@Param('sessionId') sessionId: string, @CurrentUser() user: Account) {
    return this.sessionService.getBookingDetails(sessionId, user.id);
  }

  

  @Get('available-slots/:tutorId/:date')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getAvailableSlots(@Param('tutorId') tutorId: string, @Param('date') date: string) {
    return this.sessionService.getAvailableSlots(tutorId, date);
  }

  @Get('my-sessions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  findMySessions(@Query() dto: FixedSessionPaginationDto, @CurrentUser() user: Account) {
    return this.sessionService.findUserSessions(user.id, dto);
  }

  @Get('tutor-sessions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TUTOR)
  findTutorSessions(@Query() dto: FixedSessionPaginationDto, @CurrentUser() user: Account) {
    return this.sessionService.findTutorSessions(user.id, dto);
  }

  @Get('session-count')
  @UseGuards(RolesGuard)
  @Roles(UserRole.USER)
  getUserSessionCount(@CurrentUser() user: Account) {
    return this.sessionService.getUserSessionCount(user.id);
  }
}