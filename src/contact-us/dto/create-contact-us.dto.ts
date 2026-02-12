import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateContactUsDto {
  @ApiPropertyOptional({ description: 'Category ID ' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'First name of the person' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(55)
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the person' })
  @IsOptional()
  @IsString()
  @MaxLength(55)
  lastName: string;

  @ApiProperty({ description: 'Email address of the person' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiPropertyOptional({ description: 'Phone number of the person' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber: string;


  @ApiProperty({ description: 'Message or query' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message: string;
}


export class ContactUsPaginationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(5)
  @Max(100)
  limit: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset: number;

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  keyword: string;

  @ApiPropertyOptional({ description: 'Category ID to filter' })
  @IsOptional()
  @IsString()
  categoryId: string;
}
