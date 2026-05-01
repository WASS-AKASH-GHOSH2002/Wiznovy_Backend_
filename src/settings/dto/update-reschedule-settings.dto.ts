import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRescheduleSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  reschedule_early_threshold_hours?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  reschedule_mid_threshold_hours?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  reschedule_block_threshold_hours?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  reschedule_early_fee_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  reschedule_mid_fee_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  reschedule_late_fee_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  max_reschedules_per_session?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  reschedule_fee_destination?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  max_advance_booking_days?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  tutor_reschedule_min_notice_hours?: number;
}
