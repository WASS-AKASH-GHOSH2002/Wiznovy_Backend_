import { IsNotEmpty, } from 'class-validator';

export class CreateNewsDto {
  @IsNotEmpty()
  heading: string;

  @IsNotEmpty()
  desc: string;
}
