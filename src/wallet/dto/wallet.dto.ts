import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from 'src/enum';

export class AddFundsDto {
  @ApiProperty({ example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class StripeAddFundsDto {
  @ApiProperty({ example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'pm_1234567890' })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class WithdrawFundsDto {
  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

}

export class TransactionHistoryDto {
  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  limit: number = 20;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  offset: number = 0;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  type: TransactionType;
}