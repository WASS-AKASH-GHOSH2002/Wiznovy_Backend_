import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DayOfWeek, DefaultStatus } from 'src/enum';

export class CreateAvailabilityDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsNotEmpty()
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;


  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;
}

export class AvailabilityPaginationDto {
  @ApiPropertyOptional({ example: 20, minimum: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({ enum: DefaultStatus })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorId: string;
}

export class TutorSlotDto {
  @ApiProperty({ example: 'd3f5a6b8-2b19-4b9a-9e7d-8a42a7d4b812' })
  @IsNotEmpty()
  @IsUUID()
  tutorId: string;
}