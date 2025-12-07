import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Put } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, CreateSessionReviewDto, UpdateRatingStatusDto, RatingFilterDto } from './dto/rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PermissionAction, UserRole } from 'src/enum';
import { CheckPermissions } from 'src/auth/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  createCommonRating(@Body() dto: CreateRatingDto, @CurrentUser() account: Account) {
    return this.ratingService.create(dto, account.id);
  }

  @Post('session')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.USER)
  createSessionReview(@Body() dto:CreateSessionReviewDto, @CurrentUser() account: Account) {
    return this.ratingService.createSessionReview(dto, account.id);
  }

  @Get()
  findAll(@Query() dto: RatingFilterDto) {
    return this.ratingService.findAll(dto);
  }



  @Get('session-reviews')
  @UseGuards(AuthGuard('jwt'))
  getSessionReviews(@Query() dto: RatingFilterDto, @CurrentUser() account: Account) {
    return this.ratingService.getSessionReviews(dto, account.id);
  }

  // @Get('global-count')
  // async getGlobalRatingSummary() {
  //   return await this.ratingService.getGlobalRatingSummary();
  // }

  

  

  // @Put('status/:id')
  // @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionsGuard)
  // @Roles(UserRole.ADMIN, UserRole.STAFF)
  // @CheckPermissions([PermissionAction.UPDATE, 'rating'])
  // updateStatus(@Param('id') id: string, @Body() dto: UpdateRatingStatusDto) {
  //   return this.ratingService.updateStatus(id, dto);
  // }
}