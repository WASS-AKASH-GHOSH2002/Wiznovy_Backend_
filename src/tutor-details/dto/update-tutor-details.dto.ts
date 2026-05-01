import { Type } from 'class-transformer';
import { IsArray, IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDate,
  IsNotEmpty,
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
  expertiseLevel: Level;

  @ApiPropertyOptional({ example: '123 Main St, City, Country', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  address: string;

  // @IsNotEmpty({ message: 'Hourly rate is required' })
   @IsOptional()
  hourlyRate: number;

//  @IsNotEmpty({ message: 'Hourly rate is required' })

  @IsOptional()
  trailRate: number

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

  @ApiPropertyOptional({ example: ['uuid1', 'uuid2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];

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