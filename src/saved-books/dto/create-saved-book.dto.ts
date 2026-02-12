import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavedBookDto {
  @ApiProperty({ description: 'Book ID to save', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  // @IsUUID( { message: 'bookId must be a valid UUID' })
  bookId: string;
}

export class SavedBookPaginationDto {
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

  @ApiPropertyOptional({ example: 'book keyword' })
  @IsOptional()
  @IsString()
  keyword?: string;
}