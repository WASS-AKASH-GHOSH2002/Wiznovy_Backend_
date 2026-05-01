import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Gender } from 'src/enum';

export class StaffDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Designation ID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  designationId: string;

  @ApiProperty({ enum: Gender })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1995-05-15' })
  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsOptional()
  accountId: string;
}

export class UpdateStaffDetailDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Designation ID (UUID)' })
  @IsOptional()
  @IsUUID()
  designationId: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '1995-05-15' })
  @IsOptional()
  @IsDateString()
  dob: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  city: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  state: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  country: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pin: string;

  @IsOptional()
  updatedBy: string;
}
