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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignationDto {
  @ApiProperty({ example: 'Software Engineer', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;
}

export class UpdateDesignationDto {
  @ApiPropertyOptional({ example: 'Senior Engineer', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class DesignationStatusDto {
  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
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
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}
