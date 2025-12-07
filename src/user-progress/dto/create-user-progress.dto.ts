import { IsUUID, IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserProgressDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  courseId?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsUUID()
  @IsOptional()
  studyMaterialId?: string;

  @IsUUID()
  @IsOptional()
  contentId?: string;

  @IsString()
  contentType: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  value: number;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
