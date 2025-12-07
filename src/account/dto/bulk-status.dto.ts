import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DefaultStatus } from 'src/enum';
import { ApiProperty } from '@nestjs/swagger';

export class BulkStatusUpdateDto {
  @ApiProperty({ 
    example: ['1234567890abcdef', '0987654321fedcba'], 
    description: 'Array of account IDs to update' 
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ 
    enum: DefaultStatus, 
    example: DefaultStatus.ACTIVE,
    description: 'Status to apply to all selected accounts'
  })
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}