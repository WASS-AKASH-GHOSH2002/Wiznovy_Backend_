import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { AccessTypes } from 'src/enum';
import { Type } from 'class-transformer';

export class AddContentToUnitDto {
  @IsNotEmpty()
  @IsString()
  unitId: string;

  @IsOptional()
  @IsArray()
  videoLectures: CreateVideoLectureDto[];

  @IsOptional()
  @IsArray()
  studyMaterials: CreateStudyMaterialDto[];
}

export class CreateVideoLectureDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  videoUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsEnum(AccessTypes)
  accessTypes: AccessTypes;
}

export class CreateStudyMaterialDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsEnum(AccessTypes)
  accessTypes: AccessTypes;
}

