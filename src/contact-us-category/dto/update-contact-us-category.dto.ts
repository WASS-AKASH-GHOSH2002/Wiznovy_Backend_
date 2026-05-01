import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { ContactUsType, DefaultStatus } from 'src/enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { apiFeatures } from 'src/utils/apiFeatures.utils';

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

  @ApiPropertyOptional({example:''})
  @IsOptional()
  @IsEnum(ContactUsType)
   type:ContactUsType;
}
