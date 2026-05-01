import { Controller, Get, UseGuards, Query, Post, Param } from '@nestjs/common';
import { UserPurchaseService } from './user-purchase.service';
import { UserPurchasePaginationDto } from './dto/create-user-purchase.dto';
import { UserPurchaseQueryDto } from './dto/user-purchase-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('purchase')
@ApiBearerAuth('JWT-auth')
@Controller('purchase')
export class UserPurchaseController {
  constructor(private readonly userPurchaseService: UserPurchaseService) { }

  @Get('admin/history')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllPurchases(@Query() dto: UserPurchasePaginationDto) {
    return this.userPurchaseService.findAll(dto);
  }

  @Get('my-history')
  @UseGuards(AuthGuard('jwt'))
  getMyPurchases(
    @CurrentUser() user: Account,
    @Query() query: UserPurchaseQueryDto
  ) {
    return this.userPurchaseService.findAllByUser(user.id, query);
  }

  @Get('my-courses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get all enrolled courses for current user' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'offset', type: Number, required: false, example: 0 })
  @ApiQuery({ name: 'isExpired', type: String, required: false, enum: ['true', 'false'], description: 'Filter by expiry status' })
  getMyEnrolledCourses(
    @CurrentUser() user: Account,
    @Query() query: UserPurchaseQueryDto
  ) {
    return this.userPurchaseService.getMyEnrolledCourses(user.id, query);
  }

  @Get('check-enrollment/:courseId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Check if user is enrolled in a course and if access is valid' })
  @ApiParam({ name: 'courseId', type: String })
  checkEnrollment(
    @CurrentUser() user: Account,
    @Param('courseId') courseId: string
  ) {
    return this.userPurchaseService.checkCourseEnrollment(user.id, courseId);
  }

  @Post('admin/check-expiry')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkExpiry() {
    await this.userPurchaseService.checkExpiringSoon();
    await this.userPurchaseService.checkExpired();
    return { message: 'Expiry notifications sent successfully' };
  }
}