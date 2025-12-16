
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class BoolStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  status: boolean;
}
