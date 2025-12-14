import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GlobalSearchDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating: number;

  @IsOptional()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  level: string;

  @IsOptional()
  @IsString()
  country: string;

  
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}
