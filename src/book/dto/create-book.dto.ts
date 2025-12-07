import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DefaultStatus } from 'src/enum';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  authorName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;
}

export class BookPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}