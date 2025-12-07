import { Type } from 'class-transformer';
import { IsUUID, IsString, IsOptional, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

export class MarkProgressDto {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsOptional()
  courseId: string;

  @IsString()
  @IsOptional()
  unitId: string;

  @IsString()
  @IsOptional()
  studyMaterialId: string;

  @IsString()
  @IsOptional()
  contentId: string;

  @IsString()
  contentType: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  value: number;
}

export class UserProgressPaginationDto {
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
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  isCompleted: string;
}