import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class MenuDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  title: string;
}
