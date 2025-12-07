import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSessionDto {
  @ApiProperty({ 
    description: 'The ID of the session to cancel',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  @ApiPropertyOptional({ 
    description: 'Optional reason for cancellation',
    example: 'Emergency came up'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}