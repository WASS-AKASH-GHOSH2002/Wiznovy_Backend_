import { Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
 
  IsEnum,
  IsDate,
} from 'class-validator';
import { Gender, Level, } from 'src/enum';
import {  ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDetailDto {
  @ApiPropertyOptional({ example: 'John Doe', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dob: Date;

  @ApiPropertyOptional({ enum: Level, example: Level.INTERMEDIATE })
  @IsOptional()
  @IsEnum(Level)
  englishLevel: Level;

  @ApiPropertyOptional({ example: '123 Main St, City, Country', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  address: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  topicId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  goalId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  countryId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  languageId: string;

   @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  budgetId: string;
}