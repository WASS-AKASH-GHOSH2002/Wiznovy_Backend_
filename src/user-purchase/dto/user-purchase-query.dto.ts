import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus, PurchaseType } from 'src/enum';

export class UserPurchaseQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  expired: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;
}