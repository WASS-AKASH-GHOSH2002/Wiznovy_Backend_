import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType, SessionDurationType, SessionStatus } from '../../enum';

export class CreateSessionDto {
  @ApiPropertyOptional({ description: 'User ID (required for admin manual creation)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

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

  @ApiPropertyOptional({ description: 'Payment method: COD or ONLINE', example: 'ONLINE' })
  @IsOptional()
  @IsString()
  paymentMethod: string;
}

export class SessionPaginationDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit: number;

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

 @ApiPropertyOptional({
  enum: SessionStatus,
  example: SessionStatus.SCHEDULED,
})
@IsOptional()
@IsEnum(SessionStatus)
status: SessionStatus;


@ApiPropertyOptional({
  enum: SessionType,
  example: SessionType.REGULAR,
})
@IsOptional()
@IsEnum(SessionType)
sessionType: SessionType;

 
}