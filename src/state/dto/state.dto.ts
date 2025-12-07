import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class StateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
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
