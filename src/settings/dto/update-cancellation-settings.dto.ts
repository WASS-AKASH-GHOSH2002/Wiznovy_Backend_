import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCancellationSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  early_cancel_threshold_hours?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  mid_cancel_threshold_hours?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  early_cancel_refund_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  mid_cancel_credit_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  late_cancel_credit_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  cancel_commission_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  tutor_self_cancel_min_notice_hours?: number;
}
