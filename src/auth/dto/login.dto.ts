import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/enum';

export class MobLoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ example: 'device123' })
  @IsNotEmpty()
  deviceId: string;
}

export class WebLoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  loginId: string;
}

export class OtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ example: 123456 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  otp: number;
}

export class SigninDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  loginId: string;
}

export class AdminSigninDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsNotEmpty()
  loginId: string;

  @ApiProperty({ example: 'password123' })
  @IsOptional()
  password: string;
}

export class UserLoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ip: string;
}

export class UserRegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

   @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ip: string;
}

export class ForgotPassDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @MinLength(0)
  @MaxLength(50)
  email: string;

   @ApiProperty({ enum: UserRole, example: UserRole.TUTOR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsOptional()
  newPassword: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @MinLength(0)
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @Type(() => String)
  otp: string;
}

export class SendOtpEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @MinLength(2)
  email: string;
}

export class VerifyMailOtpDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @MinLength(0)
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: 123456 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  otp: number;
}

export class ResendUserOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  email: string;
}

export class ResendTutorOtpDto {
  @ApiProperty({ example: 'tutor@example.com' })
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  email: string;
}