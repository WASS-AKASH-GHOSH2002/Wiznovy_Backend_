import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageType } from '../../enum';

export class PageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ enum: PageType })
  @IsNotEmpty()
  @IsEnum(PageType)
  pageType: PageType;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(50)
  @MaxLength(100000)
  desc: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageName?: string;
}

export class UpdatePageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: PageType, required: false, description: 'Type of the page' })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @ApiProperty({ required: false, description: 'Page content description' })
  @IsOptional()
  @MinLength(50)
  @MaxLength(100000)
  desc?: string;

  // @ApiProperty({ type: 'string', format: 'binary', required: false, description: 'Page image file' })
  // @IsOptional()
  // image?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageName?: string;
}

export class PagePaginationDto {
  @ApiProperty({ example: 20 })
  @IsNotEmpty()
  limit: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ enum: PageType, required: false })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;
}
