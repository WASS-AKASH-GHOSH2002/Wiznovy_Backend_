import { IsOptional, IsEnum, IsNumber, IsString, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminActionType, AdminActionTargetType } from 'src/enum';

export class AdminActionLogQueryDto {
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminId: string;

  @ApiPropertyOptional({ enum: AdminActionType })
  @IsOptional()
  @IsEnum(AdminActionType)
  actionType: AdminActionType;

  @ApiPropertyOptional({ enum: AdminActionTargetType })
  @IsOptional()
  @IsEnum(AdminActionTargetType)
  targetType: AdminActionTargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetId: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
