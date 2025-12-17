import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { PaymentStatus, PurchaseType } from 'src/enum';
import { CommonPaginationDto } from 'src/common/dto/common-pagination.dto';
import { Type } from 'class-transformer';

export class CreateUserPurchaseDto {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsNotEmpty()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @IsOptional()
  @IsString()
  courseId: string;

  @IsOptional()
  @IsString()
  audioLectureId: string;

  @IsOptional()
  @IsString()
  studyMaterialId: string;

  @IsOptional()
  @IsString()
  mcqTestId: string;

  @IsOptional()
  @IsString()
  unitId: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  transactionId: string;

  @IsOptional()
  expiresAt: Date;
}

export class UpdateUserPurchaseDto {
  @IsOptional()
  @IsString()
  transactionId: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @IsOptional()
  expiresAt: Date;
}

export class UserPurchasePaginationDto extends CommonPaginationDto {
  @IsOptional()
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(PurchaseType)
  purchaseType: PurchaseType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}