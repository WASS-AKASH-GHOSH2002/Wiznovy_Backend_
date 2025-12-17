import { Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Gender, Level } from 'src/enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTutorDetailDto {
  @ApiPropertyOptional({ example: 'John Smith', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1985-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dob: Date;

  @ApiPropertyOptional({ enum: Level, example: Level.EXPERTS })
  @IsOptional()
  @IsEnum(Level)
  Level: Level;

  @ApiPropertyOptional({ example: '123 Main St, City, Country', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  address: string;

   @IsOptional()
  hourlyRate: number;

  @ApiPropertyOptional({ example: 'Experienced tutor with 5+ years of teaching', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  qualificationId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  subjectId: string;

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
  cityId: string;

  @ApiPropertyOptional({ example: '1234567890abcdef' })
  @IsOptional()
  @IsString()
  stateId: string;
}