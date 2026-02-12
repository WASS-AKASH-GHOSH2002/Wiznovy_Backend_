import { IsOptional, IsEnum, IsNumber, IsString, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminActionType, AdminActionTargetType } from 'src/enum';

export class AdminActionLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  adminId: string;

  @IsOptional()
  @IsEnum(AdminActionType)
  actionType: AdminActionType;

  @IsOptional()
  @IsEnum(AdminActionTargetType)
  targetType: AdminActionTargetType;

  @IsOptional()
  @IsString()
  targetId: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
