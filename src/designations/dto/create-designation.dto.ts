import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ArrayMinSize,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DefaultStatus } from 'src/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignationDto {
  @ApiProperty({ example: 'Software Engineer', minLength: 2, maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
}

export class UpdateDesignationDto {
  @ApiPropertyOptional({ example: 'Senior Engineer', minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
}

export class DesignationStatusDto {
  @ApiProperty({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class DesignationPaginationDto {
  @ApiProperty({ example: 20, minimum: 10, maximum: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(100)
  limit: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({ example: 'engineer' })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @ApiPropertyOptional({ enum: DefaultStatus })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class BulkDesignationStatusDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'Array of designation IDs' })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}
