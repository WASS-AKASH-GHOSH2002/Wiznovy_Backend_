import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmSessionPaymentDto {
  @ApiProperty({ example: '1234567890abcdef' })
  @IsNotEmpty()
  @IsString()
  purchaseId: string;

  @ApiProperty({ example: 'pi_1234567890abcdef' })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;
}