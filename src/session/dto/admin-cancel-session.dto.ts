import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCancelSessionDto {
  @ApiPropertyOptional({ 
    description: 'Reason for cancellation',
    example: 'Policy violation'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
