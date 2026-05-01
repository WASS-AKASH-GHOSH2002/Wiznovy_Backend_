import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSessionDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ 
    description: 'Reason for cancellation',
    example: 'Emergency came up'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}