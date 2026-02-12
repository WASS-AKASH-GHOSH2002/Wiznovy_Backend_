import { Controller, Get, Post, Body,Query, UseGuards } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, CreateSessionReviewDto,  RatingFilterDto } from './dto/rating.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Account } from 'src/account/entities/account.entity';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {  UserRole } from 'src/enum';


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

  @Get('global-count')
  getGlobalRatingSummary() {
    return this.ratingService.getGlobalRatingSummary();
  }

}