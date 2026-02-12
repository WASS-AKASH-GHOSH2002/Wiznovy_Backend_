import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DefaultStatus, FaqType } from 'src/enum';

export class FaqDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  question: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  answer: string;

  @IsOptional()
  @IsEnum(FaqType)
  type: FaqType;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  answer: string;

  @IsOptional()
  @IsEnum(FaqType)
  type: FaqType;
}

export class FaqPaginationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(5)
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
  @IsEnum(DefaultStatus)
  status: DefaultStatus;

  @IsOptional()
  @IsEnum(FaqType)
  type: FaqType;
}
export class BulkFaqStatusDto {
  @IsNotEmpty()
  @IsString({ each: true })
  ids: string[];

  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}