import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

export class CityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  name: string;

  
  
  @IsOptional()
  @IsString()
  countryId: string
 
}

export class UpdateCityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  countryId: string
}

export class PaginationSDto {
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(50)
  limit: number;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiProperty()
  @IsOptional()
  keyword: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  status: boolean;
}
