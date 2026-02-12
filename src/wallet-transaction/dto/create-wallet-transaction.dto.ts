import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TransactionType, TransactionStatus } from 'src/enum';

export class CreateWalletTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;



  @IsString()
  @IsOptional()
  referenceId?: string;
}

export class UpdateWalletTransactionDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsString()
  @IsOptional()
  description?: string;
}

export class WalletTransactionPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}