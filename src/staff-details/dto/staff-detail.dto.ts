import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/enum';

export class StaffDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  designation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsNotEmpty()
  dob: Date;

  @IsOptional()
  accountId: string;
}

export class UpdateStaffDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  designation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsNotEmpty()
  dob: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  panNo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(20)
  aadharNo: string;

  @IsOptional()
  updatedBy: string;
}
