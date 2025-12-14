import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class BoolStatusDto {
  @IsNotEmpty()
  @Type(() => Boolean)
  @IsBoolean()
  status: boolean;
}

export class DefaultStatusDto {
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}