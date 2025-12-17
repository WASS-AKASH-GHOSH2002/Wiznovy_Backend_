import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType, SessionDurationType } from '../../enum';

export class CreateSessionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  tutorId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  sessionDate: string;

  @ApiProperty({ example: '10:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ enum: SessionType, example: SessionType.REGULAR })
  @IsNotEmpty()
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiPropertyOptional({ enum: SessionDurationType, example: SessionDurationType.SHORT })
  @IsOptional()
  @IsEnum(SessionDurationType)
  trialDuration?: SessionDurationType;


}

export class SessionPaginationDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'SCHEDULED' })
  @IsOptional()
  @IsString()
  status?: string;
}