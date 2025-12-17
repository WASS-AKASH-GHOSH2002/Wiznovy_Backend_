import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';
import { DefaultStatus } from 'src/enum';
import { Type } from 'class-transformer';

export class CreateUnitDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  

  @IsOptional()
  @IsString()
  courseId: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class UnitPaginationDto {
 

  @IsOptional()
  @IsString()
  courseId: string;

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

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;

 
}