import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserContactDto {
  @ApiPropertyOptional({ 
    example: 'newemail@example.com',
    description: 'New email address for the user'
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ 
    example: '+1234567890',
    description: 'New phone number for the user'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}