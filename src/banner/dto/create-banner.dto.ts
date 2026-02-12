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
import { BannerType, DefaultStatus } from 'src/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class BannerDto {
  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;

  
   @ApiPropertyOptional({ enum:BannerType, example: BannerType.USER_WEBSITE })
  @IsOptional()
  @IsEnum(BannerType)
  bannerType:BannerType;
}


export class BannerPaginationDto {
  @ApiProperty({ example: 20, minimum: 10, maximum: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  limit: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({ example: 'banner keyword' })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @ApiPropertyOptional({ enum: DefaultStatus })
  @IsOptional()
  status: DefaultStatus;

   @ApiPropertyOptional({ enum:BannerType, example: BannerType.USER_WEBSITE })
  @IsOptional()
  @IsEnum(BannerType)
  bannerType:BannerType;

}

export class BannerFilterDto {
  @ApiPropertyOptional({ enum: BannerType, description: 'Filter by banner type' })
  @IsOptional()
  @IsEnum(BannerType)
  bannerType: BannerType;

  // @ApiPropertyOptional({
  //   enum: DefaultStatus,
  //   description: 'Filter by status',
  //   default: DefaultStatus.ACTIVE,
  // })
  // @IsOptional()
  // @IsEnum(DefaultStatus)
  // status?: DefaultStatus = DefaultStatus.ACTIVE;
}