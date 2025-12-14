import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PageType } from '../../enum';

export class CreatePageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ enum: PageType, description: 'Type of the page' })
  @IsNotEmpty()
  @IsEnum(PageType)
  pageType: PageType;

  @ApiProperty({ description: 'Page content description' })
  @IsNotEmpty()
  @MinLength(50)
  @MaxLength(100000)
  desc: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false, description: 'Page image file' })
  @IsOptional()
  image?: any;
}