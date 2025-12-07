import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import {AccessTypes } from 'src/enum';
import { Type } from 'class-transformer';

export class CreateStudyMaterialDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;
  


  @IsOptional()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  videoLectureId: string;

}

export class UpdateStudyMaterialDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  


}

export class StudyMaterialPaginationDto {
  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  videoLectureId: string;

  @IsOptional()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsString()
  subjectId: string;

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
export class StudyMaterialFilterDto {

  @IsOptional()
  @IsString()
  keyword: string;

  @IsOptional()
  @IsString()
  videoLectureId: string;

  

  @IsOptional()
  @IsString()
  unitId: string;


  
  
}
