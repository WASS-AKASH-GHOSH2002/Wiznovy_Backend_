import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType } from 'src/enum';
import { Transform } from 'class-transformer';

export class NotificationDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  desc: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  accountId: any;

  deviceId: any;
}

export class NotificationFilterDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset: number = 0;

  @IsOptional()
  @IsString()
  fromDate: string;

  @IsOptional()
  @IsString()
  toDate: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  read: boolean;
}
