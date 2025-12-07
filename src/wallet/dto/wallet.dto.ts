import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '../entities/wallet.entity';

export class AddFundsDto {
  @ApiProperty({ example: 100.50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Session payment from user' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'session_123' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class WithdrawFundsDto {
  @ApiProperty({ example: 50.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Payout withdrawal' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'payout_456' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class TransactionHistoryDto {
  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  offset?: number = 0;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}