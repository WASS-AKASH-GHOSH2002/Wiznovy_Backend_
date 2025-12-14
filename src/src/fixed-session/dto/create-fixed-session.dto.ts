import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeSlot, SessionDurationType } from 'src/enum';

export class CreateFixedSessionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  tutorId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  sessionDate: string;

  @ApiProperty({ enum: TimeSlot })
  @IsNotEmpty()
  @IsEnum(TimeSlot)
  timeSlot: TimeSlot;

  @ApiProperty({ enum: SessionDurationType })
  @IsNotEmpty()
  @IsEnum(SessionDurationType)
  duration: SessionDurationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes: string;
}

export class FixedSessionPaginationDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit: number = 20;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  offset: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: TimeSlot })
  @IsOptional()
  @IsEnum(TimeSlot)
  timeSlot?: TimeSlot;
}