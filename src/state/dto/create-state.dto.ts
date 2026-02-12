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
  IsUUID,
} from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class CreateStateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code: string;

  @IsNotEmpty()
  @IsUUID()
  countryId: string;
}

export class UpdateStateDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code: string;

  @IsOptional()
  @IsUUID()
  countryId: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class StateStatusDto {
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class BulkStateStatusDto {
  @IsNotEmpty()
  @IsString({ each: true })
  ids: string[];

  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class StatePaginationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
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

  @IsOptional()
  @IsUUID()
  countryId: string;
}