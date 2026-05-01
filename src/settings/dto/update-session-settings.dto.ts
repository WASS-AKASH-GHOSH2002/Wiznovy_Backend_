import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSessionSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  trial_duration_minutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  regular_session_duration_minutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  session_buffer_minutes?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  trial_commission_percent?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1)
  max_trials_per_student_tutor?: number;
}
