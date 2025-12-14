import { IsString, IsOptional, IsNumber, IsEnum, Min, Max, MinLength, MaxLength, IsNotEmpty, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessTypes, CourseStatus } from '../../enum';

export class CreateCourseDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPrice: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  validityDays: number;

  @IsNotEmpty()
  @IsEnum(AccessTypes)
  accessType: AccessTypes;

  @IsOptional()
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @IsNotEmpty()
  @IsString()
  totalDuration: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalLectures: number;

  @IsOptional()
  @IsString()
  authorMessage: string;

  @IsOptional()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  languageId: string;

  @IsOptional()
  @IsString()
  tutorId: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  validityDays: number;

  @IsOptional()
  @IsEnum(AccessTypes)
  accessType: AccessTypes;

  @IsOptional()
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @IsOptional()
  @IsString()
  totalDuration: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalLectures: number;

  @IsOptional()
  @IsString()
  authorMessage: string;

  @IsOptional()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  languageId: string;

  @IsOptional()
  @IsString()
  deletionReason: string;
}

export class CoursePaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @IsOptional()
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @IsOptional()
  @IsEnum(AccessTypes)
  accessType: AccessTypes;

  @IsOptional()
  @IsString()
  tutorId: string;

  @IsOptional()
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  languageId: string;
}