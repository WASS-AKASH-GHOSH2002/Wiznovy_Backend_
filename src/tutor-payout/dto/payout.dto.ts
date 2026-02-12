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

  @IsNotEmpty()
  @IsString()
  bankDetailId: string;
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
  keyword: string;

  @ApiProperty({ enum: PayoutStatus, required: false })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tutorName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fromDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toDate: string;
}

export class ApprovePayoutDto {
  @ApiProperty({ example: 'Approved after verification' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'txn_1234567890' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsString()
  paidAt?: string;

  @ApiProperty({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;
}

export class RejectPayoutDto {
  @ApiProperty({ example: 'Insufficient balance' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}