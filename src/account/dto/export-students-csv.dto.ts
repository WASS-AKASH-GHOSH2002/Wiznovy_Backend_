import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum DateRangePreset {
  THIS_WEEK     = 'THIS_WEEK',
  LAST_WEEK     = 'LAST_WEEK',
  LAST_MONTH    = 'LAST_MONTH',
  LAST_3_MONTHS = 'LAST_3_MONTHS',
  CUSTOM        = 'CUSTOM',
}

export class ExportStudentsCsvDto {
  @IsOptional()
  @IsEnum(DateRangePreset)
  preset?: DateRangePreset;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
