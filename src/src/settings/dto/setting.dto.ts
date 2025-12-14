import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SettingDto {
  @IsOptional()
  @IsUrl()
  user_domain: string;

  @IsOptional()
  @IsUrl()
  admin_domain: string;

  @IsOptional()
  @IsString()
  @MinLength(0)
  @MaxLength(150)
  mobile_domain: string;

  @IsOptional()
  @IsString()
  facebook: string;

  @IsOptional()
  @IsString()
  linkedIn: string;

  @IsOptional()
  @IsString()
  twitter: string;

  @IsOptional()
  @IsString()
  instagram: string;

  @IsOptional()
  @IsString()
  whatsApp: string;
}
