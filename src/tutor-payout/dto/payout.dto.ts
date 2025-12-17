import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

import { Type } from 'class-transformer';
import { PaymentMethod, PayoutStatus } from 'src/enum';

export class CreatePayoutDto {
  @ApiProperty({ example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Bank: ABC Bank, Account: 123456789' })
  @IsNotEmpty()
  @IsString()
  paymentDetails: string;
}

export class PayoutPaginationDto {
  @ApiProperty({ example: 20 })
  @IsNotEmpty()
  @Type(() => Number)
  limit: number;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  @Type(() => Number)
  offset: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ enum: PayoutStatus, required: false })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tutorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toDate?: string;
}

export class ApprovePayoutDto {
  @ApiProperty({ example: 'Approved after verification' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPayoutDto {
  @ApiProperty({ example: 'Insufficient balance' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}