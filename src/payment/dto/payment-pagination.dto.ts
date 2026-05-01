import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PurchaseType } from '../../enum';

export class PaymentPaginationDto {
  @ApiPropertyOptional({ description: 'Search keyword for payment reference or description' })
  @IsOptional()
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ enum: PurchaseType, description: 'Filter by purchase type' })
  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Filter from date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate: string;

  @ApiPropertyOptional({ description: 'Filter to date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate: string;

  @ApiPropertyOptional({ description: 'Filter by transaction/payment ID' })
  @IsOptional()
  @IsString()
  transactionId: string;

  @ApiPropertyOptional({ description: 'Filter by student user ID (e.g. WIZ_STU_...)' })
  @IsOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Filter by account ID' })
  @IsOptional()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Number of records to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({ description: 'Number of records to return', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}