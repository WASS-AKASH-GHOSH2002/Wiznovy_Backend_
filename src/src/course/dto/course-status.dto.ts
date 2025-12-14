import { IsEnum, IsNotEmpty } from 'class-validator';
import { CourseStatus } from 'src/enum';
import { ApiProperty } from '@nestjs/swagger';

export class CourseStatusDto {
  @ApiProperty({ enum: CourseStatus, example: CourseStatus.APPROVED })
  @IsNotEmpty()
  @IsEnum(CourseStatus)
  status: CourseStatus;
}