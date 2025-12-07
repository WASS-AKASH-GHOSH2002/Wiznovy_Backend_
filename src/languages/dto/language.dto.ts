import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class LanguageDto {
  @ApiProperty({ example: 'English', minLength: 2, maxLength: 50 })
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional({ example: 'Spanish', minLength: 2, maxLength: 50 })
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;
}

export class LanguageStatusDto {
  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class StatusDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  @Transform(({ value }) => value)
  @IsBoolean()
  status: boolean;
}

export class PaginationDto {
  @ApiProperty({ example: 20, minimum: 10, maximum: 50 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(50)
  limit: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({ example: 'english' })
  keyword: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  status: boolean;
}