import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class SettingDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  title: string;

  @IsOptional()
  @IsString()
  domain: string;
    @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  logo: string;

  @IsOptional()
  @IsString()
  logoPath: string;

  @IsOptional()
  @IsString()
  wpLink: string;

  @IsOptional()
  @IsString()
  fbLink: string;

  @IsOptional()
  @IsString()
  instaLink: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyCity: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyGstin: string;

  @IsOptional()
  @IsNumber()
  pdfMargin: number;

  @IsOptional()
  @IsString()
  invoiceDeclaration: string;
  
  @IsOptional()
  @IsNumber()
  gstPercentage: number;

  @IsOptional()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}
