import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  DefaultStatus,
  Gender,
} from 'src/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'john_doe', minLength: 5, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  loginId: string;

  @ApiProperty({ example: 'password123', minLength: 5, maxLength: 30 })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  password: string;

  @ApiProperty({ example: 'John Doe', maxLength: 30 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({ example: 'john@example.com', maxLength: 55 })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(55)
  email: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  dob: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  city: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  state: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  country: string;

  @ApiPropertyOptional({ example: '123456', minLength: 6, maxLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  pin: string;
}

export class UpdateStaffPasswordDto {
  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  loginId: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  password: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ example: 'john.smith@example.com' })
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  dob: Date;
}

export class PaginationDto {
  @ApiProperty({ example: 20, minimum: 10, maximum: 50 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(50)
  limit: number;

  @ApiProperty({ example: 0, minimum: 0, maximum: 1000 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  offset: number;

  @ApiPropertyOptional({ example: 'search keyword' })
  @IsOptional()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @ApiPropertyOptional({ enum: DefaultStatus })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class StatusDto {
  @ApiProperty({ enum: DefaultStatus })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}

export class EmailUpdateDto {
  @ApiPropertyOptional({ example: 'newemail@example.com' })
  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(50)
  email: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  otp: string;
}

export class SearchUserPaginationDto {
  @ApiProperty({ example: 20, minimum: 1, maximum: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional({ enum: DefaultStatus })
  @IsOptional()
  status: DefaultStatus;

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
  qualificationId: string;
}