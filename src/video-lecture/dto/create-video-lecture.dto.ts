import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessTypes } from 'src/enum';

export class CreateVideoLectureDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration: number;
 
}

export class UpdateVideoLectureDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;


  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  duration: number;

}

export class VideoLecturePaginationDto {
  @IsOptional()
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  boardId: string;

  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsEnum(AccessTypes)
  accessTypes: AccessTypes;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(5)
  @Max(100)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset: number;
}
export class Filter {

  @IsOptional()
  @IsString()
  keyword: string;


  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Max(100)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset: number;

  

  @IsOptional()
  @IsString()
  unitId: string;


  @IsOptional()
  @IsEnum(AccessTypes)
  accessTypes: AccessTypes;
}