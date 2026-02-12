import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsEmail, Min, Max, Length } from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  title?: string;

  @IsOptional()
  @IsEmail()
  @Length(1, 100)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  companyAddress?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  companyPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency?: string;

  @IsOptional()
  @IsString()
  zoomApiKey?: string;

  @IsOptional()
  @IsString()
  zoomApiSecret?: string;

  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  zoomEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  stripeEnabled?: boolean;

  @IsOptional()
  @IsString()
  emailHost?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  emailPort?: number;

  @IsOptional()
  @IsString()
  emailUser?: string;

  @IsOptional()
  @IsString()
  emailPassword?: string;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sessionCommissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  courseCommissionRate?: number;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;
}