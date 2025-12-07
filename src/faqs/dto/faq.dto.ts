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
import { DefaultStatus } from 'src/enum';

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
  @IsEnum(['USER', 'TUTOR'])
  type: 'USER' | 'TUTOR';
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  answer: string;

  @IsOptional()
  @IsEnum(['USER', 'TUTOR'])
  type: 'USER' | 'TUTOR';
}

export class FaqPaginationDto {
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

  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;

  @IsOptional()
  @IsEnum(['USER', 'TUTOR'])
  type: 'USER' | 'TUTOR';
}
