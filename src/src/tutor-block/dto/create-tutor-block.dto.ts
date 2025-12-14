import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTutorBlockDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  blockDate: string;

  @ApiProperty({ example: '10:00' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Personal appointment' })
  @IsOptional()
  @IsString()
  reason?: string;
}