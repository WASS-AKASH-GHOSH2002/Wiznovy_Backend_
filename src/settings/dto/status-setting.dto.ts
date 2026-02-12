import { IsEnum, IsNotEmpty } from 'class-validator';
import { DefaultStatus } from 'src/enum';

export class StatusSettingDto {
  @IsNotEmpty()
  @IsEnum(DefaultStatus)
  status: DefaultStatus;
}
