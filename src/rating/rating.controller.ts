import { Controller, Get, Post, Body, Query, UseGuards, Param, Delete, Patch } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, CreateSessionReviewDto, RatingFilterDto } from './dto/rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { UserRole, PermissionAction } from 'src/enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('rating')
@ApiBearerAuth('JWT-auth')
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a rating' })
  createCommonRating(@Body() dto: CreateRatingDto, @CurrentUser() account: Account) {
    return this.ratingService.create(dto, account.id);
  }

  @Post('session')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create a session review' })
  createSessionReview(@Body() dto: CreateSessionReviewDto, @CurrentUser() account: Account) {
    return this.ratingService.createSessionReview(dto, account.id);
  }

  // ─── Static GET routes (must be before :id) ──────────────────────────────

  @Get('all')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'rating'])
  @ApiOperation({ summary: 'Get all reviews (Admin)' })
  findAll(@Query() dto: RatingFilterDto) {
    return this.ratingService.findAll(dto);
  }

  @Get('session-reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get session reviews for current tutor' })
  getSessionReviews(@Query() dto: RatingFilterDto, @CurrentUser() account: Account) {
    return this.ratingService.getSessionReviews(dto, account.id);
  }

  @Get('my-ratings')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all ratings submitted by current user' })
  getMyRatings(@Query() dto: RatingFilterDto, @CurrentUser() account: Account) {
    return this.ratingService.getMyRatings(account.id, dto);
  }

  @Get('my-reviews')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiOperation({ summary: 'Get all reviews received by current tutor' })
  getMyTutorReviews(@Query() dto: RatingFilterDto, @CurrentUser() account: Account) {
    return this.ratingService.getTutorReviewsById(account.id, dto);
  }

  @Get('global-count')
  @ApiOperation({ summary: 'Get global rating summary' })
  getGlobalRatingSummary() {
    return this.ratingService.getGlobalRatingSummary();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all ratings for a course (public)' })
  getCourseRatings(@Param('courseId') courseId: string, @Query() dto: RatingFilterDto) {
    return this.ratingService.getCourseRatings(courseId, dto);
  }

  @Get('tutor/by-code/:tutorCode')
  @ApiOperation({ summary: 'Get all reviews by tutor ID code e.g. WIZ_TUT_00001 (public)' })
  getTutorReviewsByCode(@Param('tutorCode') tutorCode: string, @Query() dto: RatingFilterDto) {
    return this.ratingService.getTutorReviewsByCode(tutorCode, dto);
  }

  @Get('tutor/:tutorId')
  @ApiOperation({ summary: 'Get all reviews for a tutor by account ID (public)' })
  getTutorReviews(@Param('tutorId') tutorId: string, @Query() dto: RatingFilterDto) {
    return this.ratingService.getTutorReviewsById(tutorId, dto);
  }



  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.READ, 'rating'])
  @ApiOperation({ summary: 'Get rating by ID (Admin)' })
  findById(@Param('id') id: string) {
    return this.ratingService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.UPDATE, 'rating'])
  @ApiOperation({ summary: 'Update a rating (Admin)' })
  updateRating(@Param('id') id: string, @Body() dto: CreateRatingDto) {
    return this.ratingService.updateRating(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @CheckPermissions([PermissionAction.DELETE, 'rating'])
  @ApiOperation({ summary: 'Delete a rating (Admin)' })
  deleteRating(@Param('id') id: string) {
    return this.ratingService.deleteRating(id);
  }
}
