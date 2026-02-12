import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { DefaultStatus } from 'src/enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactUsCategoryDto {
  @ApiPropertyOptional({ example: 'Customer Support', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ enum: DefaultStatus, example: DefaultStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}
