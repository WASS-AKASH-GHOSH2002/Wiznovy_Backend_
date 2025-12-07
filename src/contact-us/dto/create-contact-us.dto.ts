import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactUsDto {
  @ApiPropertyOptional({ description: 'Account ID (optional for logged-in users)' })
  @IsOptional()
  @IsString()
  accountId?: string;

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

  @ApiPropertyOptional({ description: 'Country code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiProperty({ description: 'Message or query' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message: string;
}