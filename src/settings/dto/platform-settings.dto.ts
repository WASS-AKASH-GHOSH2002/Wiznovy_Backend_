import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateApiKeysDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zoomApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zoomApiSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stripeSecretKey?: string;
}

export class UpdateIntegrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  zoomEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stripeEnabled?: boolean;
}
