import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/enum';
import { Account } from 'src/account/entities/account.entity';
import { TutorPayoutService } from './tutor-payout.service';
import { CreatePayoutDto, PayoutPaginationDto, ApprovePayoutDto, RejectPayoutDto } from './dto/payout.dto';

@ApiTags('tutor-payout')
@ApiBearerAuth('JWT-auth')
@Controller('tutor-payout')
export class TutorPayoutController {
  constructor(private readonly tutorPayoutService: TutorPayoutService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Create payout request' })
  @ApiBody({ type: CreatePayoutDto })
  @ApiResponse({ status: 201, description: 'Payout request created successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance or missing bank details' })
  createPayout(@Body() dto: CreatePayoutDto, @CurrentUser() user: Account) {
    return this.tutorPayoutService.createPayout(user.id, dto);
  }

  @Get('admin/list')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all payout requests for admin' })
  @ApiQuery({ name: 'limit', type: Number, required: true, example: 20 })
  @ApiQuery({ name: 'offset', type: Number, required: true, example: 0 })
  @ApiQuery({ name: 'keyword', type: String, required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'tutorName', type: String, required: false })
  @ApiQuery({ name: 'fromDate', type: String, required: false })
  @ApiQuery({ name: 'toDate', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated payout requests' })
  getAllPayouts(@Query() dto: PayoutPaginationDto) {
    return this.tutorPayoutService.getAllPayouts(dto);
  }

  @Get('my-payouts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get tutor own payout requests' })
  @ApiResponse({ status: 200, description: 'Returns tutor payout requests' })
  getMyPayouts(@CurrentUser() user: Account) {
    return this.tutorPayoutService.getTutorPayouts(user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get payout request details' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Returns payout request details' })
  getPayoutDetails(@Param('id') id: string) {
    return this.tutorPayoutService.getPayoutDetails(id);
  }

  @Put('approve/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Approve payout request' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ApprovePayoutDto })
  @ApiResponse({ status: 200, description: 'Payout approved successfully' })
  approvePayout(@Param('id') id: string, @Body() dto: ApprovePayoutDto, @CurrentUser() user: Account) {
    return this.tutorPayoutService.approvePayout(id, user.id, dto);
  }

  @Put('reject/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Reject payout request' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: RejectPayoutDto })
  @ApiResponse({ status: 200, description: 'Payout rejected successfully' })
  rejectPayout(@Param('id') id: string, @Body() dto: RejectPayoutDto, @CurrentUser() user: Account) {
    return this.tutorPayoutService.rejectPayout(id, user.id, dto);
  }
}