import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { RatingStatus } from 'src/enum';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment: string;

  @IsOptional()
  @IsString()
  tutorId: string;

  @IsOptional()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  sessionId: string;
}

export class CreateSessionReviewDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;

  //  @IsNotEmpty()
  // @IsString()
  // tutorId: string;
}

export class UpdateRatingStatusDto {
  @IsNotEmpty()
  @IsEnum(RatingStatus)
  status: RatingStatus;
}

export class RatingFilterDto extends CommonPaginationDto {
 

  @IsOptional()
  @IsString()
  accountId: string;
}

export class TutorFeedbackFilterDto extends CommonPaginationDto {
  @IsOptional()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  sessionId: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  ratingScore: number;

  @IsOptional()
  @IsString()
  fromDate: string;

  @IsOptional()
  @IsString()
  toDate: string;

  @IsOptional()
  @IsEnum(['newest', 'highest', 'lowest'])
  sortBy: 'newest' | 'highest' | 'lowest';

  @IsOptional()
  @IsEnum(['course', 'session', 'all'])
  type: 'course' | 'session' | 'all';
}