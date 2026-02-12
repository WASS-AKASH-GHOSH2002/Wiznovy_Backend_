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

export class CreateTopicDto {
  @ApiProperty({ example: 'Nutrition Basics', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

 
}

export class UpdateTopicDto {
  @ApiPropertyOptional({ example: 'Advanced Nutrition', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;


  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class TopicStatusDto {
  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class TopicPaginationDto {
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

  @ApiPropertyOptional({ example: 'nutrition' })
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

export class BulkTopicStatusDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'Array of topic IDs' })
  @IsNotEmpty()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}