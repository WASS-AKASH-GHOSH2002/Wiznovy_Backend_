import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CourseStatus } from 'src/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseStatusDto {
  @ApiProperty({ enum: CourseStatus, example: CourseStatus.APPROVED })
  @IsNotEmpty()
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @ApiPropertyOptional({ example: 'Content does not meet quality standards.' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}