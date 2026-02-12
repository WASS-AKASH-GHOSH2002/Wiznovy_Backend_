import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBankDetailDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  accountNo: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  accountHolderName: string;

  @ApiProperty({ example: 'SBIN0001234' })
  @IsNotEmpty()
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  ifscCode: string;

  @ApiProperty({ example: 'SBININBB123', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  swiftCode: string;

  @ApiProperty({ example: 'Main Branch' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  bankName: string;


}

export class UpdateBankDetailDto {
  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  accountNo?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountHolderName?: string;

  @ApiProperty({ example: 'SBIN0001234', required: false })
  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(20)
  ifscCode?: string;

  @ApiProperty({ example: 'SBININBB123', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  swiftCode?: string;

  @ApiProperty({ example: 'Main Branch', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

 
}