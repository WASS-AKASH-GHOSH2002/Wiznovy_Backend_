import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsEmail, Min, Max, Length, MaxLength } from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @Length(1, 50)
  title?: string;

  @IsOptional() @IsEmail() @Length(1, 100)
  email?: string;

  @IsOptional() @IsString()
  domain?: string;

  @IsOptional() @IsString()
  wpLink?: string;

  @IsOptional() @IsString()
  fbLink?: string;

  @IsOptional() @IsString()
  instaLink?: string;

  @IsOptional() @IsString() @Length(1, 100)
  companyName?: string;

  @IsOptional() @IsString() @MaxLength(100)
  companyYear?: string;

  @IsOptional() @IsString() @Length(1, 255)
  companyAddress?: string;

  @IsOptional() @IsString() @MaxLength(100)
  companyCity?: string;

  @IsOptional() @IsString() @Length(1, 20)
  companyPhone?: string;

  @IsOptional() @IsString() @MaxLength(20)
  companyGstin?: string;

  @IsOptional() @IsString() @Length(1, 10)
  currency?: string;

  @IsOptional() @IsString() @MaxLength(10)
  language?: string;

  @IsOptional() @IsString() @MaxLength(50)
  timezone?: string;

  // ─── Stripe ───────────────────────────────────────────────────────────
  @IsOptional() @IsString() @MaxLength(255)
  stripe_secret_key?: string;

  @IsOptional() @IsString() @MaxLength(255)
  stripe_publishable_key?: string;

  @IsOptional() @IsString() @MaxLength(255)
  stripe_webhook_secret?: string;

  // ─── Zoom ─────────────────────────────────────────────────────────────
  @IsOptional() @IsString() @MaxLength(255)
  zoom_account_id?: string;

  @IsOptional() @IsString() @MaxLength(255)
  zoom_client_id?: string;

  @IsOptional() @IsString() @MaxLength(255)
  zoom_client_secret?: string;

  // ─── Email ────────────────────────────────────────────────────────────
  @IsOptional() @IsString()
  emailHost?: string;

  @IsOptional() @IsNumber() @Min(1) @Max(65535)
  emailPort?: number;

  @IsOptional() @IsString()
  emailUser?: string;

  @IsOptional() @IsString()
  emailPassword?: string;

  @IsOptional() @IsBoolean()
  emailEnabled?: boolean;

  // ─── Commission & Limits ──────────────────────────────────────────────
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  sessionCommissionRate?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  courseCommissionRate?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(100)
  maxTopCourses?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(100)
  maxTopSubjects?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  gstPercentage?: number;

  @IsOptional() @IsNumber() @Min(0)
  pdfMargin?: number;

  @IsOptional() @IsString()
  invoiceDeclaration?: string;

  @IsOptional() @IsEnum(DefaultStatus)
  status?: DefaultStatus;
}
