import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in INR', example: 500 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'inr', required: false })
  @IsString()
  @IsOptional()
  currency?: string = 'inr';

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateSessionPaymentDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;
}

export class CreateCoursePaymentDto {
  @ApiProperty({ description: 'Course ID' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Amount in INR', example: 1500 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Refund amount in INR', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;

  @ApiProperty({ 
    description: 'Refund reason', 
    enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
    required: false 
  })
  @IsString()
  @IsOptional()
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: string;
}

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer email' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  name: string;
}

export class PaymentHistoryQueryDto {
  @ApiProperty({ description: 'Number of records to return', required: false, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: 'Number of records to skip', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}