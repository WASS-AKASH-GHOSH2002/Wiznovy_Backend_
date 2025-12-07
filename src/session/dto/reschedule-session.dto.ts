import { IsNotEmpty, IsUUID, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleSessionDto {
  @ApiProperty({ 
    description: 'The ID of the session to reschedule',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiProperty({ 
    description: 'New session date',
    example: '2024-01-20'
  })
  @IsNotEmpty()
  @IsDateString()
  newSessionDate: string;

  @ApiProperty({ 
    description: 'New start time',
    example: '14:00'
  })
  @IsNotEmpty()
  @IsString()
  newStartTime: string;

  @ApiProperty({ 
    description: 'New end time',
    example: '15:00'
  })
  @IsNotEmpty()
  @IsString()
  newEndTime: string;
}