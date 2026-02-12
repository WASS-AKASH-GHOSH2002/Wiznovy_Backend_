import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
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