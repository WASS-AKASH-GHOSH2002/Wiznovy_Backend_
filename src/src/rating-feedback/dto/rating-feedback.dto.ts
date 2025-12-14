import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RatingFeedbackDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  desc: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  accountId: string;
}

export class FeedbackPaginationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  limit: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @IsOptional()
  companyDetailId: string
}
