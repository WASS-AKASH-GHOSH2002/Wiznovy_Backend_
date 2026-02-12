import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { BookStatus } from 'src/enum';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  authorName: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  subjectId: string;

  @IsOptional()
  @IsUUID()
  languageId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalPages: number;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  imagePath: string;

  @IsOptional()
  @IsEnum(BookStatus)
  status: BookStatus;

  @IsOptional()
  @IsUUID()
  createdBy: string;
}

export class BookPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(100)
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(BookStatus)
  status: BookStatus;

  @IsOptional()
  @IsUUID()
  languageId: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  tutorId?: string;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(BookStatus)
  status: BookStatus;
}

export class BulkBookStatusDto {
  @IsNotEmpty()
  @IsString({ each: true })
  ids: string[];

  @IsNotEmpty()
  @IsEnum(BookStatus)
  status: BookStatus;
}

