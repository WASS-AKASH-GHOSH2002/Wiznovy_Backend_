import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class CreateCountryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code: string;

}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class CountryStatusDto {
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class CountryPaginationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(100)
  limit: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
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